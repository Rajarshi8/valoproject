# Multi-Region Deployment Guide

This guide provides instructions for deploying probe servers across multiple cloud regions to enable accurate Valorant ping testing.

## Overview

To provide accurate ping measurements, you should deploy probe servers in regions that match or are close to Valorant's actual server locations:

- **North America (NA)**: US East (Virginia) or US West (Oregon)
- **Europe (EU)**: Frankfurt, London, or Paris
- **Korea (KR)**: Seoul
- **Brazil (BR)**: São Paulo
- **Latin America (LATAM)**: US East (closer to Central/South America)
- **Asia Pacific (AP)**: Singapore, Tokyo, or Sydney

## Deployment Options

### Option 1: Cloud VPS (Recommended for Production)

Deploy lightweight probe servers on affordable VPS instances in each region.

#### 1.1 Using DigitalOcean

**Prerequisites:**
- DigitalOcean account
- `doctl` CLI installed

**Deploy to a region:**

```bash
# Create a droplet in a specific region
doctl compute droplet create valorant-probe-na \
  --image docker-20-04 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID

# SSH into the droplet
ssh root@<droplet-ip>

# Clone your repository or copy server files
git clone <your-repo-url>
cd valoproject/server

# Install dependencies and start
npm install --production
PORT=3001 node index.js

# Or use Docker
docker build -t valorant-probe .
docker run -d -p 3001:3001 --restart unless-stopped valorant-probe
```

**Regions to use:**
- NA: `nyc1` (New York) or `sfo3` (San Francisco)
- EU: `fra1` (Frankfurt) or `lon1` (London)
- AP: `sgp1` (Singapore)
- BR: Use another provider (DigitalOcean doesn't have Brazil)

**Estimated cost:** ~$6/month per region

#### 1.2 Using AWS Lightsail

```bash
# Install AWS CLI
aws configure

# Create instance in us-east-1
aws lightsail create-instances \
  --instance-names valorant-probe-na \
  --availability-zone us-east-1a \
  --blueprint-id amazon_linux_2 \
  --bundle-id nano_2_0

# Get the instance IP
aws lightsail get-instance --instance-name valorant-probe-na

# SSH and setup
ssh -i your-key.pem ec2-user@<instance-ip>
sudo yum install -y docker
sudo service docker start
sudo docker pull node:18-alpine
# ... continue with Docker setup
```

**Regions:**
- NA: `us-east-1` (Virginia)
- EU: `eu-central-1` (Frankfurt)
- AP: `ap-southeast-1` (Singapore)
- KR: `ap-northeast-2` (Seoul)
- BR: `sa-east-1` (São Paulo)

**Estimated cost:** ~$3.50/month per region

### Option 2: Docker Compose (Single Server)

If you can't afford multiple regions, deploy all probes on a single server:

```bash
cd valoproject
docker-compose up -d
```

**Note:** This will only measure latency to that one server location, not actual Valorant regions.

### Option 3: Serverless Functions (Vercel/Netlify)

Use the existing Vercel setup for edge deployments. Vercel Edge Functions automatically deploy to multiple regions.

**Already configured** in `vercel.json` and `api/ping.js`.

```bash
# Deploy to Vercel
npm install -g vercel
vercel --prod
```

Vercel Edge Network provides locations close to most Valorant regions automatically.

### Option 4: Kubernetes Multi-Region

For advanced users, deploy using Kubernetes across multiple cloud regions.

**deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: valorant-probe
spec:
  replicas: 1
  selector:
    matchLabels:
      app: valorant-probe
  template:
    metadata:
      labels:
        app: valorant-probe
    spec:
      containers:
      - name: probe
        image: your-registry/valorant-probe:latest
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
---
apiVersion: v1
kind: Service
metadata:
  name: valorant-probe
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3001
  selector:
    app: valorant-probe
```

Deploy to each region's cluster and note the external IPs.

## Configuring the Frontend

After deploying probes, update the frontend configuration in `client/src/App.tsx`:

```typescript
const REGIONS: Region[] = [
  { 
    id: 'na', 
    name: 'North America', 
    url: 'https://na-probe.yourdomain.com', // or IP
    host: '', // Leave empty if pinging the probe directly
    port: '' 
  },
  { 
    id: 'eu', 
    name: 'Europe', 
    url: 'https://eu-probe.yourdomain.com',
    host: '',
    port: ''
  },
  // ... add all your probe URLs
];
```

## Terraform Configuration (Infrastructure as Code)

For automated multi-region deployment on AWS:

**main.tf:**

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "regions" {
  default = ["us-east-1", "eu-central-1", "ap-northeast-2", "sa-east-1", "ap-southeast-1"]
}

provider "aws" {
  alias  = "region"
  region = var.regions[count.index]
}

resource "aws_instance" "probe" {
  count         = length(var.regions)
  ami           = "ami-0c55b159cbfafe1f0" # Amazon Linux 2
  instance_type = "t2.micro"
  
  tags = {
    Name = "valorant-probe-${var.regions[count.index]}"
  }

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker
    service docker start
    docker run -d -p 3001:3001 --restart unless-stopped your-registry/valorant-probe:latest
  EOF
}

output "probe_ips" {
  value = aws_instance.probe[*].public_ip
}
```

**Deploy:**

```bash
terraform init
terraform plan
terraform apply
```

## Security Considerations

1. **Rate Limiting**: The probe server includes built-in rate limiting (100 req/min per IP)
2. **Firewall**: Only expose port 3001 (or your chosen port)
3. **HTTPS**: Use a reverse proxy (nginx, Caddy) with Let's Encrypt for HTTPS
4. **Monitoring**: Set up uptime monitoring (UptimeRobot, Pingdom)

**Example nginx reverse proxy config:**

```nginx
server {
    listen 80;
    server_name na-probe.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name na-probe.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/na-probe.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/na-probe.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Cost Estimation

| Provider | Regions | Monthly Cost |
|----------|---------|--------------|
| AWS Lightsail | 5 regions | ~$17.50 |
| DigitalOcean | 4 regions | ~$24 |
| Vercel Edge | Global | Free (Hobby) |
| Mixed (Vercel + 2 VPS) | Good coverage | ~$12 |

## Testing Your Deployment

```bash
# Test a probe endpoint
curl https://na-probe.yourdomain.com/ping

# Expected response:
# {"server_time":1700000000000}

# Test with proxy ping
curl "https://na-probe.yourdomain.com/ping?host=google.com&port=443"

# Expected response:
# {"rtt":15,"t_server":1700000000001,"host":"google.com","port":443}
```

## Maintenance

- **Updates**: Pull latest code and restart: `git pull && docker-compose restart`
- **Logs**: `docker logs -f <container-id>`
- **Monitoring**: Set up alerts for downtime
- **Backups**: Not necessary for stateless probe servers

## Troubleshooting

**Problem:** High latency to all regions
- **Solution:** Check your local internet connection

**Problem:** Probe not responding
- **Solution:** Check firewall rules, ensure port 3001 is open

**Problem:** CORS errors
- **Solution:** Verify CORS headers in server response

**Problem:** Rate limit errors
- **Solution**: Increase `RATE_LIMIT_MAX` in server/index.js or wait 1 minute

## Next Steps

1. Deploy probes to at least 3 regions for meaningful results
2. Update frontend URLs to point to your probes
3. Test end-to-end functionality
4. Set up monitoring and alerts
5. Document your deployment in your project README
