# Week 1 Final Architecture

**Authors:** HuyNQ, Cursor AI

This document shows the final architecture that will be achieved after completing all 6 steps in the Week 1 tasks guide. It includes guidance on collaboration requirements with Sys Admin and DevOps teams.

## Architecture Overview

The final architecture consists of a production-ready, secure full-stack application deployed on Azure Kubernetes Service (AKS) with:
- Custom domain with HTTPS/SSL certificate
- Authentication integration (OpenID or custom)
- Ingress-based routing for both frontend and backend services
- Automated SSL certificate management via cert-manager
- Container registry for image storage and deployment

## ASCII Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LOCAL DEVELOPMENT ENVIRONMENT                        │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                               │
│  │   API Source    │    │  React Source   │                               │
│  │  (Node.js/TS)   │    │   (React/TS)    │                               │
│  │                 │    │                 │                               │
│  └─────────────────┘    └─────────────────┘                               │
│           │                       │                                        │
│           ▼ docker build          ▼ docker build                          │
│  ┌─────────────────┐    ┌─────────────────┐                               │
│  │   API Image     │    │  React App      │                               │
│  │  (Node.js/TS)   │    │   Image         │                               │
│  │    :latest      │    │  (Static)       │                               │
│  └─────────────────┘    └─────────────────┘                               │
│           │                       │                                        │
│           └───────────┬───────────┘                                        │
│                       ▼ docker push                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AZURE CLOUD                                   │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    AZURE CONTAINER REGISTRY (ACR)                    │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐    ┌─────────────────┐                          │  │
│  │  │   API Image     │    │  React App      │                          │  │
│  │  │  (Node.js/TS)   │    │   Image         │                          │  │
│  │  │    :latest      │    │  (Static)       │                          │  │
│  │  └─────────────────┘    └─────────────────┘                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼ docker pull                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                 AZURE KUBERNETES SERVICE (AKS)                       │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    INGRESS CONTROLLER                          │  │  │
│  │  │                      (nginx-ingress)                           │  │  │
│  │  │                                                                 │  │  │
│  │  │  /          →  React App Service (Static Files)                │  │  │
│  │  │  /api/*     →  API Service (Node.js)                           │  │  │
│  │  │  /health    →  API Health Check                                │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                ▲                                      │  │
│  │                                │ HTTPS Traffic                        │  │
│  │  ┌──────────────────┐    ┌──────────────────┐                        │  │
│  │  │   REACT APP      │    │    API SERVICE   │                        │  │
│  │  │   DEPLOYMENT     │    │    DEPLOYMENT    │                        │  │
│  │  │                  │    │                  │                        │  │
│  │  │ ┌──────────────┐ │    │ ┌──────────────┐ │                        │  │
│  │  │ │   Pod 1      │ │    │ │   Pod 1      │ │                        │  │
│  │  │ │              │ │    │ │              │ │                        │  │
│  │  │ │ React App    │ │◄──┤│ │ Node.js API  │ │                        │  │
│  │  │ │ (Static)     │ │   ││ │ (Express)    │ │                        │  │
│  │  │ │ Port: 8080   │ │   ││ │ Port: 3000   │ │                        │  │
│  │  │ └──────────────┘ │   ││ └──────────────┘ │                        │  │
│  │  └──────────────────┘   │└──────────────────┘                        │  │
│  │           │              │          │                                 │  │
│  │           │              │          │                                 │  │
│  │  ┌────────▼──────────┐   │ ┌────────▼──────────┐                     │  │
│  │  │  React Service    │   │ │   API Service     │                     │  │
│  │  │  ClusterIP        │   │ │   ClusterIP       │                     │  │
│  │  │  Port: 8080       │   │ │   Port: 3000      │                     │  │
│  │  └───────────────────┘   │ └───────────────────┘                     │  │
│  │                          │                                           │  │
│  │                          │ Internal K8s Communication                │  │
│  │                          └─────────────────────────────────────────► │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     AZURE WEB APP (Step 1)                           │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                API Container Instance                           │  │  │
│  │  │                (Alternative Deployment)                         │  │  │
│  │  │                                                                 │  │  │
│  │  │  Node.js API (Express) - Port: 3000                            │  │  │
│  │  │  Health Check: /health                                          │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL DEPENDENCIES                               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    AUTHENTICATION PROVIDERS                          │  │
│  │                                                                       │  │
│  │  Option 1: OpenID Connect                                            │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │              https://id-dev.mindx.edu.vn                       │  │  │
│  │  │                   (OpenID Provider)                             │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  Option 2: Custom Authentication                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Firebase Auth                                │  │  │
│  │  │                   (Optional)                                    │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOWS                                    │
│                                                                             │
│  Internet Users                                                            │
│        │                                                                   │
│        ▼                                                                   │
│  ┌─────────────┐  HTTPS via   ┌─────────────────────────────────────────┐  │
│  │   Browser   │  Custom      │     Custom Domain (yourdomain.com)     │  │
│  └─────────────┘  Domain      │     SSL Certificate (Let's Encrypt)    │  │
│                                │                                         │  │
│                                ▼                                         │  │
│                   ┌─────────────────────────────────────────────────────┐  │
│                   │           Ingress Controller                       │  │
│                   │  + cert-manager for SSL automation               │  │
│                   │                                                   │  │
│                   │  Route: /      → React App (HTTPS)               │  │
│                   │  Route: /api/* → API Service (HTTPS)             │  │
│                   │  HTTP → HTTPS redirect                           │  │
│                   └─────────────────────────────────────────────────────┘  │
│                                                                             │
│  Authentication Flow:                                                       │
│  1. User accesses https://yourdomain.com (React App)                       │
│  2. React App redirects to Auth Provider (OpenID or Firebase)              │
│  3. User authenticates and receives JWT token                              │
│  4. React App makes HTTPS API calls to https://yourdomain.com/api/*        │
│  5. API validates token and returns protected data                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Flow

The architecture follows a clear Docker-first deployment pattern with progressive complexity:

### Step 1: API Foundation (Azure Web App)
1. **Source Code Development:** API (Node.js/TypeScript) developed locally
2. **Container Build & Push:** API containerized and pushed to Azure Container Registry (ACR)
3. **Azure Web App Deployment:** API deployed to Azure Web App as alternative hosting method

### Step 2: Kubernetes Foundation (AKS)
1. **AKS Cluster Setup:** Kubernetes cluster provisioned with ACR integration
2. **Internal API Deployment:** API deployed to AKS with ClusterIP service (internal access only)
3. **Cluster Verification:** API tested via port-forwarding and internal cluster access

### Step 3: External Access (Ingress)
1. **Ingress Controller Installation:** nginx-ingress or similar installed in AKS cluster
2. **API Routing Configuration:** Ingress resource created for external API access
3. **Public API Verification:** API accessible via ingress external IP address

### Step 4: Full-Stack Application (React Frontend)
1. **React Development:** Frontend application built with API integration
2. **Container Build & Push:** React app containerized and pushed to ACR
3. **AKS Deployment:** React app deployed to AKS with ingress routing configuration

### Step 5: Authentication Integration
1. **Authentication Provider Setup:** Configure OpenID or Firebase authentication
2. **Service Updates:** Update both frontend and backend for authentication flows
3. **Redeployment:** Rebuild containers, push to ACR, and redeploy with auth integration

### Step 6: Production-Ready Security (HTTPS & Domain)
1. **Domain Configuration:** DNS setup pointing custom domain to ingress
2. **SSL Certificate Management:** cert-manager installation with Let's Encrypt integration
3. **HTTPS Enforcement:** SSL configuration with automatic HTTP to HTTPS redirect

## Collaboration Requirements

This architecture requires coordination with different teams based on permission levels:

### 🔧 Sys Admin Collaboration Required
- **Step 1 & 2:** Azure subscription setup and AKS cluster provisioning
- **Step 6:** DNS management and domain configuration
- **Security Policies:** Review and approval of SSL certificate authorities

### 🔧 DevOps Collaboration Required  
- **Step 1:** Azure Container Registry creation and access configuration
- **Step 2:** AKS cluster access and kubectl configuration
- **Step 3:** Ingress controller installation (cluster admin permissions)
- **Step 6:** cert-manager installation and cluster-wide resource management

### 👨‍💻 Developer Self-Service
- **Step 1:** Application development and Docker containerization
- **Step 4:** React application development and deployment
- **Step 5:** Authentication integration and testing
- **All Steps:** Code commits, manifest creation, and application testing

## Architecture Components

### 1. Azure Container Registry (ACR)
- **Purpose:** Stores container images for both API and React applications
- **Images:** 
  - `api:latest` - Node.js/TypeScript Express API
  - `react-app:latest` - React application (static build files)

### 2. Azure Kubernetes Service (AKS)
- **Main Deployment Platform:** Hosts both frontend and backend services
- **Components:**
  - **Ingress Controller (nginx-ingress):** Standalone nginx handling all HTTP routing and SSL termination
  - **API Deployment:** Node.js Express API running in pods
  - **React App Deployment:** React application as static content (no embedded nginx)
  - **Services:** ClusterIP services for internal communication

**Design Rationale:** This architecture uses standalone nginx (ingress controller) rather than embedded nginx:
- **Educational Consistency:** Students learn nginx routing in Step 3, then apply same pattern in Step 4
- **Separation of Concerns:** Web server (nginx) separate from application containers
- **Enterprise Pattern:** Matches production architectures with dedicated ingress layer
- **Scalability:** Can scale nginx routing independently from application services
- **Centralized Routing:** Single point for SSL termination, routing rules, and traffic management

### 3. Azure Web App (Alternative)
- **Purpose:** Alternative deployment method for API (Step 1)
- **Configuration:** Runs the same containerized API as AKS deployment

### 4. Authentication Integration
- **Option 1:** OpenID Connect with `https://id-dev.mindx.edu.vn`
- **Option 2:** Custom authentication (Firebase optional)
- **Flow:** JWT token-based authentication between frontend and backend

### 5. SSL/TLS Certificate Management
- **cert-manager:** Automated SSL certificate provisioning and renewal
- **Let's Encrypt:** Free SSL certificates with automatic renewal
- **Certificate Storage:** Kubernetes secrets for SSL certificate management

### 6. Custom Domain & DNS
- **Domain Configuration:** Custom domain pointing to ingress external IP
- **DNS Management:** A record or CNAME configuration
- **HTTPS Enforcement:** Automatic HTTP to HTTPS redirect

## Traffic Flow

1. **External Access:** Users access `https://yourdomain.com` via custom domain with SSL
2. **SSL Termination:** Ingress controller handles SSL/TLS termination
3. **Routing:** Ingress routes HTTPS requests based on path:
   - `/` → React App Service
   - `/api/*` → API Service
4. **Internal Communication:** React app communicates with API through Kubernetes internal networking
5. **Authentication:** Both services integrate with chosen authentication provider over HTTPS

## Deployment Strategy

- **Progressive Deployment:** 6-step approach from simple to production-ready
- **Docker-First:** All applications containerized using Docker locally
- **Image Registry:** Centralized image storage in Azure Container Registry
- **Kubernetes Orchestration:** AKS manages container lifecycle, scaling, and networking
- **Alternative Hosting:** Azure Web App provides simpler deployment option for API comparison
- **Infrastructure as Code:** All manifests and configurations version controlled

## Security Features

- **HTTPS Everywhere:** All external traffic encrypted with valid SSL certificates
- **Automatic SSL Renewal:** cert-manager handles certificate lifecycle
- **Authentication:** JWT token validation on protected routes
- **Network Isolation:** Services communicate through Kubernetes internal networking
- **Container Security:** Images built with security best practices
- **Domain Security:** Custom domain with proper SSL certificate validation