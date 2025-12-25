# Week 1 Tasks: Step-by-Step Implementation Guide

**Authors:** HuyNQ, Cursor AI  
**Document Summary:** This document provides a comprehensive step-by-step walkthrough for completing Week 1 objectives of the MindX Engineer Onboarding program. The guide covers building and deploying a full-stack application on Azure Cloud infrastructure, progressing from a simple containerized API to a complete authenticated web application. Each step builds incrementally, introducing core DevOps concepts including containerization, Azure services, Kubernetes orchestration, and authentication integration. The final deliverable is a production-ready full-stack application running on Azure Kubernetes Service (AKS) with proper authentication flows.

**Customization Note:** This guide can be customized and tailored to your preferences, tech stack choices, or project requirements, as long as the end goals from the Week 1 overview are met. Feel free to adapt the steps, technologies, or deployment approaches to match your learning objectives or organizational needs.

**Example Prompt for Customization:**
*"Here is the original plan for first week [The guide]. I want to develop both API and web app in the same repo rather than separate repos, tailor this guide to that direction, make sure the end goals are still met."*

Other customization examples:
- Using different authentication providers or databases
- Modifying deployment strategies or container orchestration approaches

This document provides a detailed walkthrough of the tasks needed to complete Week 1 objectives. Each step builds upon the previous one to create a full-stack application deployed on Azure Cloud.

## 🔧 Sys Admin / DevOps Collaboration Guide

Throughout this guide, you'll see **🔧 Sys Admin / DevOps Check** or **🔧 DevOps Collaboration** notes. These indicate tasks that may require elevated permissions or collaboration with your infrastructure team.

**Permission Levels:**
- **Developer:** Can write code, build containers, create basic Kubernetes resources
- **DevOps:** Can manage cloud resources, install cluster tools, configure CI/CD
- **Sys Admin:** Can manage domains, DNS, security policies, and provision infrastructure

**Quick Self-Assessment:**
- Run `az account show` - Do you see subscription details?
- Run `kubectl cluster-info` - Can you see cluster information?
- Check if you can access your organization's DNS management console

If any checks fail, coordinate with your infrastructure team early in the process.

## Step 1: Simple Repository with Azure Container Registry and API Deployment

### Overview
Create a minimal API application, containerize it, push to Azure Container Registry (ACR), and deploy to Azure Web App. Note that despite the name "Azure Web App," this service can host both APIs and web applications - we'll be deploying an API.

**📋 Alternative Approach:** For a more aggressive learning path, Azure Web App deployment can be skipped entirely. You can proceed directly to Step 2 (AKS deployment) after completing tasks 1.1-1.4. This approach saves time but misses the opportunity to compare different Azure hosting options.

### Prerequisites
- Azure subscription with appropriate permissions
- Docker installed locally
- Azure CLI installed and configured
- Git repository access

**🔧 Sys Admin / DevOps Check:**
- **Azure Permissions Required:** Can you create Azure Container Registry, Azure Web App, and AKS clusters?
- **Simple Test:** Try running `az group create --name test-rg --location eastus` (delete after test)
- **If No Access:** Request Azure subscription contributor/owner permissions from Sys Admin

### Tasks

#### 1.1 Create Simple API
Build a basic Node.js/TypeScript Express API server with health check and hello world endpoints. The API should be production-ready with proper TypeScript configuration and build scripts.

#### 1.2 Containerize the API
Create a Docker container for the API with optimized image size and proper configuration. The container should run the API successfully in any environment.

#### 1.3 Set Up Azure Container Registry (ACR)
Establish an Azure Container Registry to store container images. Configure authentication and ensure local Docker can connect to push images.

**🔧 DevOps Collaboration:** Creating ACR requires Azure permissions
- **Check:** Can you run `az acr create --name myregistry --resource-group mygroup --sku Basic`?
- **If No:** Ask DevOps team to create ACR and provide access credentials

#### 1.4 Build and Push Container Image to ACR
Build the Docker image locally, tag it properly, and push to Azure Container Registry. Test the push process and verify the image is stored and accessible for deployment.

#### 1.5 Deploy API to Azure Web App from ACR
Create an Azure Web App service configured to pull and run the containerized API from Azure Container Registry. Configure the service with proper settings and health checks, ensuring it uses the pushed container image.

**🔧 DevOps Collaboration:** Azure Web App creation requires permissions
- **Check:** Can you run `az webapp create --name myapp --resource-group mygroup --plan myplan`?
- **If No:** Ask DevOps team to create Web App or provide App Service Contributor role

#### 1.6 Verify API Deployment
Ensure the deployed API is accessible via public HTTPS URL and all endpoints respond correctly. Confirm logging and monitoring are working.

#### 1.7 Repository Setup
Initialize Git repository with all code, configurations, and documentation. Push to remote repository with proper version tagging and comprehensive README.

### Deliverables for Step 1
- Working containerized API deployed to Azure Web App
- Public HTTPS API endpoint accessible via Azure Web App URL
- Container image stored in Azure Container Registry
- Complete source code in Git repository
- Documentation for local development and deployment process

**Note:** If using the alternative approach (skipping Azure Web App), deliverables are limited to ACR setup, containerized API, and repository with documentation.

### Success Criteria
- API responds to HTTP requests on the Azure Web App URL
- Container image successfully stored and retrievable from ACR
- All source code and configurations are version controlled
- Documentation allows another developer to reproduce the deployment
- Health check endpoint returns successful response

**Alternative Success Criteria:** If skipping Azure Web App, ensure container image works locally and is successfully pushed to ACR, ready for AKS deployment in Step 2.

### 🤖 AI Learning Hints

**Where to start:**
*"I need to learn how to containerize and deploy an API to Azure. What are the fundamental concepts I should understand first before starting with Docker containers and Azure Container Registry?"*

**What key points to learn:**
*"I'm working on containerizing a Node.js API and deploying it to Azure Web App via ACR. What are the essential Docker concepts, Azure services, and deployment patterns I need to master for this task?"*

**How to create plan to execute:**
*"Help me break down the process of building a containerized API and deploying it to Azure into a step-by-step execution plan. What's the logical sequence and what should I prepare for each step?"*

**How to troubleshoot using AI:**
*"My containerized API deployment to Azure Web App is failing. Here's my error message: [paste error]. Walk me through systematic troubleshooting steps for Docker containerization and Azure deployment issues."*

*"Help me investigate my Azure Web App deployment issue. Here are my logs from `az webapp log tail --name myapp --resource-group mygroup`: [paste logs]. What could be causing the deployment failure?"*

*"My Docker container builds locally but fails on Azure. Here's the output from `docker logs [container-id]` and `az acr repository show-tags --name myregistry --repository myapp`: [paste output]. How do I debug this?"*

---

## Step 2: Deploy Application to Azure Kubernetes Service (AKS)

### Overview
Deploy the containerized API from Step 1 to Azure Kubernetes Service (AKS). This step introduces container orchestration and prepares the infrastructure for scaling and managing multiple services.

### Prerequisites
- Completed Step 1 with working Azure Web App deployment (or alternative approach with ACR setup only)
- Azure Container Registry with pushed container image
- kubectl installed locally
- Azure CLI with AKS extension

**📋 Note:** If you skipped Azure Web App deployment in Step 1, you can proceed directly with the container image from ACR.

### Tasks

#### 2.1 Create AKS Cluster
Provision an Azure Kubernetes Service cluster with appropriate node configuration. The cluster should be properly configured for development workloads with basic networking and security settings.

**🔧 Sys Admin Collaboration:** AKS requires significant Azure permissions
- **Check:** Can you run `az aks create --name myaks --resource-group mygroup --node-count 1`?
- **If No:** AKS creation typically requires Sys Admin - request cluster creation or Kubernetes Service Contributor role

#### 2.2 Configure Cluster Access
Set up local kubectl access to the AKS cluster and verify connectivity. Ensure the cluster can pull images from the existing Azure Container Registry.

**🔧 DevOps Collaboration:** Requires AKS access permissions
- **Check:** Can you run `az aks get-credentials --name myaks --resource-group mygroup`?
- **If No:** Ask DevOps team for AKS access or kubeconfig file

#### 2.3 Create Kubernetes Manifests
Write Kubernetes deployment and service YAML files for the API. Include proper resource limits, health checks, and service exposure configuration.

#### 2.4 Deploy API to AKS from ACR
Apply the Kubernetes manifests to deploy the API to AKS. Configure the deployment to pull and use the existing container image from Azure Container Registry (pushed in Step 1).

#### 2.5 Expose API Service
Create a Kubernetes ClusterIP service for the API. This will prepare the API for internal cluster communication and later ingress routing.

#### 2.6 Verify Internal AKS Deployment
Test the API deployment within the cluster using port-forwarding or internal cluster access. Confirm the API pods are running and health checks are working.

#### 2.7 Update Repository
Commit all Kubernetes manifests and deployment scripts to the Git repository. Update documentation to include AKS deployment instructions alongside the Azure Web App deployment.

### Deliverables for Step 2
- Working AKS cluster with deployed API
- Kubernetes manifests for deployment and ClusterIP service
- API accessible internally within the AKS cluster
- Updated repository with AKS deployment documentation
- Both Azure Web App and AKS API deployments running simultaneously

### Success Criteria
- API responds to HTTP requests via internal cluster access (port-forwarding)
- Kubernetes pods are running and healthy in the cluster
- AKS cluster can successfully pull images from Azure Container Registry
- Both API deployment methods (Azure Web App and AKS) are documented and functional
- Health check endpoints work correctly in both environments

### 🤖 AI Learning Hints

**Where to start:**
*"I need to learn Kubernetes and Azure Kubernetes Service (AKS). What are the core Kubernetes concepts I should understand before deploying applications to AKS?"*

**What key points to learn:**
*"I'm deploying a containerized API to AKS. What Kubernetes resources (pods, deployments, services), AKS-specific features, and Azure integration patterns are essential for this task?"*

**How to create plan to execute:**
*"Help me create a systematic plan for deploying my containerized API from ACR to AKS. What's the proper sequence for cluster setup, Kubernetes manifests, and deployment verification?"*

**How to troubleshoot using AI:**
*"My AKS deployment is having issues. Here's my kubectl output and error: [paste details]. Guide me through debugging Kubernetes deployments, pod failures, and Azure integration problems."*

*"My pods are not starting in AKS. Here's the output from `kubectl get pods`, `kubectl describe pod [pod-name]`, and `kubectl logs [pod-name]`: [paste output]. Help me identify and fix the issue."*

*"My AKS cluster can't pull images from ACR. Here's my setup and the output from `az aks check-acr --name myaks --resource-group mygroup --acr myregistry.azurecr.io`: [paste results]. What's wrong with my configuration?"*

---

## Step 3: Setup Ingress Controller for API Access

### Overview
Configure an ingress controller in the AKS cluster to provide external access to the API service. This step establishes external routing and prepares the infrastructure for handling multiple services with proper URL-based routing.

### Prerequisites
- Completed Step 2 with API deployed to AKS and running internally
- API service accessible via ClusterIP within the cluster
- kubectl configured for AKS cluster access

### Tasks

#### 3.1 Install Ingress Controller
Install and configure an ingress controller (nginx-ingress or similar) in the AKS cluster. Ensure the controller is properly set up with external IP allocation.

**🔧 DevOps Collaboration:** Ingress controller requires cluster admin permissions
- **Check:** Can you run `kubectl create namespace ingress-nginx` and install helm charts?
- **If No:** Ask DevOps team to install ingress controller or provide cluster admin access

#### 3.2 Create Ingress Resource for API
Write an ingress YAML manifest to route external traffic to the API service. Configure proper path routing (e.g., `/api/*` → API service) and health check endpoints.

#### 3.3 Apply Ingress Configuration
Deploy the ingress resource to the AKS cluster and verify the ingress controller assigns an external IP address for public access.

#### 3.4 Verify External API Access
Test the API endpoints via the ingress external IP address. Confirm all API routes are accessible from the internet and health checks respond correctly.

#### 3.5 Update Repository and Documentation
Commit ingress manifests and update documentation with external access instructions. Document the ingress configuration alongside existing deployment methods.

### Deliverables for Step 3
- Working ingress controller deployed in AKS cluster
- Ingress resource routing external traffic to API service
- Public API endpoint accessible via ingress external IP
- Updated repository with ingress configuration manifests
- Documentation for external API access via ingress

### Success Criteria
- API responds to HTTP requests via ingress external IP address
- Ingress controller successfully routes traffic to API service
- All API endpoints (including health checks) accessible from internet
- Ingress configuration properly documented and version controlled
- External access works alongside internal cluster communication

### 🤖 AI Learning Hints

**Where to start:**
*"I need to understand Kubernetes ingress controllers and external traffic routing. What are the fundamental networking concepts I should learn before setting up ingress for my AKS cluster?"*

**What key points to learn:**
*"I'm setting up an ingress controller for my AKS cluster to expose my API externally. What are the key concepts about ingress controllers, load balancing, and path-based routing I need to master?"*

**How to create plan to execute:**
*"Help me plan the setup of an ingress controller in AKS with external access to my API service. What's the step-by-step process for installation, configuration, and testing?"*

**How to troubleshoot using AI:**
*"My ingress controller setup is not working - I can't access my API externally. Here's my ingress YAML and kubectl status: [paste details]. Help me debug ingress routing and external access issues."*

*"My ingress isn't getting an external IP. Here's the output from `kubectl get ingress`, `kubectl get svc -n ingress-nginx`, and `kubectl describe ingress [ingress-name]`: [paste output]. What could be preventing external IP assignment?"*

*"Traffic isn't routing to my API through ingress. Here's my ingress logs from `kubectl logs -n ingress-nginx [ingress-controller-pod]` and service status from `kubectl get endpoints`: [paste logs]. Help me debug the routing issue."*

---

## Step 4: Setup and Deploy React Web App to AKS

### Overview
Create a React frontend web application that connects to the API from Steps 1 and 2. Deploy the web app directly to the existing AKS cluster, establishing communication between frontend and backend services within Kubernetes.

### Prerequisites
- Completed Steps 1-3 with working API deployments and ingress access
- AKS cluster with API service running and accessible via ingress
- Node.js and npm/yarn installed locally
- Docker and kubectl configured for AKS cluster

### Tasks

#### 4.1 Create React Web Application
Build a React/TypeScript application with routing and API integration. The app should connect to the API service via the ingress endpoint from Step 3 with proper error handling.

#### 4.2 Containerize and Push to ACR (Similar to Step 1)
Create Docker container for React app with static build files, build locally, and push to Azure Container Registry. The container serves static content without nginx (routing handled by ingress controller).

#### 4.3 Create Kubernetes Manifests (Similar to Step 2)
Write Kubernetes deployment and service YAML files for the React app. Follow the same manifest structure as Step 2 but configure for frontend service.

#### 4.4 Deploy React App to AKS from ACR
Deploy React app to the same AKS cluster as the API using the pushed container image from ACR. Create ClusterIP service for the React app.

#### 4.5 Update Ingress for Full-Stack Routing
Modify the existing ingress resource to route traffic to both web app and API services with proper path-based routing (e.g., `/` → React app, `/api/*` → API service). The ingress controller (nginx) handles all routing - no nginx needed in React container.

#### 4.6 Verify Full Stack and Update Repository
Test complete frontend-to-backend communication within AKS via ingress. Commit all code and manifests following the same repository structure as previous steps.

### Deliverables for Step 4
- Working React web application deployed to AKS
- Frontend and backend services running in the same AKS cluster
- Updated ingress with path-based routing for both web app and API
- Internal service-to-service communication within Kubernetes
- Complete full-stack application with proper error handling
- Updated repository with frontend code and deployment manifests

### Success Criteria
- React web app responds to HTTP requests via ingress public endpoint
- Frontend successfully communicates with backend API via ingress routing
- Both services are accessible through ingress controller with proper path-based routing
- API calls from React app return expected responses through ingress
- Health checks work for both frontend and backend services
- Complete development and deployment workflow documented

### 🤖 AI Learning Hints

**Where to start:**
*"I need to learn how to deploy React applications to Kubernetes and connect them with backend APIs. What are the fundamental concepts for containerizing frontend apps and setting up full-stack communication in AKS?"*

**What key points to learn:**
*"I'm deploying a React app to AKS that needs to communicate with my existing API service. What are the essential patterns for frontend containerization, service communication, and ingress routing for full-stack applications?"*

**How to create plan to execute:**
*"Help me create a plan for deploying my React frontend to AKS and configuring it to work with my existing API through ingress routing. What's the step-by-step process for full-stack deployment?"*

**How to troubleshoot using AI:**
*"My React app is deployed to AKS but can't communicate with my API service. Here's my frontend-backend setup and network configuration: [paste details]. Help me debug service communication and routing issues in Kubernetes."*

*"My React app pods are failing to start. Here's the output from `kubectl logs [react-pod-name]`, `kubectl describe pod [react-pod-name]`, and my Dockerfile: [paste details]. What's causing the startup failure?"*

*"My frontend can't reach the backend API through ingress. Here's my network testing from inside a pod using `kubectl exec -it [pod-name] -- curl [api-endpoint]` and my ingress configuration: [paste results]. Help me debug the service communication."*

---

## Step 5: Implement Authentication (Registration/Login or OpenID)

### Overview
Integrate authentication into the full-stack application from Steps 1-4. Choose between custom Registration/Login system (Firebase optional) or OpenID integration with https://id-dev.mindx.edu.vn. Update both frontend and backend to handle authentication flows.

### Prerequisites
- Completed Steps 1-4 with working full-stack application in AKS
- React frontend and API backend communicating properly via ingress
- Basic understanding of JWT tokens and authentication flows

### Tasks

#### 5.1 Choose Authentication Method
Decide between custom Registration/Login system or OpenID integration. For custom auth, Firebase can be used but is not required. For OpenID, use the provided https://id-dev.mindx.edu.vn endpoint.

#### 5.2 Update API for Authentication
Modify the backend API to handle authentication endpoints and JWT token validation. Implement middleware for protecting routes and user session management.

#### 5.3 Update React App for Auth UI
Add login/registration components to the React application. Implement authentication state management and protected route handling in the frontend.

#### 5.4 Configure Authentication Flow
Set up the complete authentication flow between frontend and backend via ingress routing. Ensure proper token storage, refresh mechanisms, and logout functionality.

#### 5.5 Test and Deploy Auth Updates (Similar to Previous Steps)
Test authentication locally, then containerize and deploy updated services to AKS via ingress. Follow the same build, push, and deployment process as previous steps.

### Deliverables for Step 5
- Working authentication system integrated into both frontend and backend
- User registration and login functionality (custom or OpenID)
- Protected routes and API endpoints with proper authorization
- Updated services deployed to AKS with authentication flow
- JWT token handling and session management

### Success Criteria
- Users can successfully register and login through the frontend via ingress
- Backend API properly validates authentication tokens
- Protected routes are inaccessible without valid authentication
- Authentication state persists across browser sessions
- Logout functionality works correctly
- Authentication flow works end-to-end through ingress routing

### 🤖 AI Learning Hints

**Where to start:**
*"I need to implement authentication for my full-stack application (React + API). What are the fundamental authentication concepts, JWT tokens, and security patterns I should understand first?"*

**What key points to learn:**
*"I'm implementing authentication with either custom login/registration or OpenID integration. What are the essential security practices, token management, and authentication flow patterns for full-stack applications?"*

**How to create plan to execute:**
*"Help me plan the implementation of authentication for my React frontend and Node.js API deployed on AKS. What's the step-by-step approach for secure authentication flows and protected routes?"*

**How to troubleshoot using AI:**
*"My authentication system isn't working properly - users can't login or tokens aren't being validated correctly. Here's my auth flow and error details: [paste details]. Help me debug authentication and authorization issues."*

*"My API authentication middleware is failing. Here's the logs from `kubectl logs [api-pod-name]` showing JWT validation errors and my middleware code: [paste details]. Help me debug token validation issues."*

*"Users can't complete the login flow. Here's my frontend console errors, backend API logs from `kubectl logs [api-pod-name] --follow`, and auth service configuration: [paste details]. What's breaking the authentication flow?"*

---

## Step 6: Setup HTTPS Domain and SSL Certificate

### Overview
Configure a custom domain with HTTPS/SSL certificate for the full-stack application. This step secures the application with proper SSL encryption and provides a professional domain name instead of using the ingress IP address.

### Prerequisites
- Completed Steps 1-5 with working authenticated full-stack application
- Ingress controller running with external IP address
- Domain name available for configuration (or ability to use a subdomain)
- Basic understanding of DNS configuration

### Tasks

#### 6.1 Domain Configuration
Configure DNS records to point your custom domain to the ingress controller's external IP address. Set up A record or CNAME record for the domain.

**🔧 Sys Admin Collaboration:** DNS management typically requires admin access
- **Check:** Do you have access to your organization's DNS management console?
- **If No:** Ask Sys Admin team to configure DNS records or provide DNS management access

#### 6.2 Install Cert-Manager
Install and configure cert-manager in the AKS cluster for automatic SSL certificate management. Set up Let's Encrypt or other certificate authority integration.

**🔧 DevOps Collaboration:** Cert-manager requires cluster admin permissions
- **Check:** Can you install helm charts and create cluster-wide resources?
- **If No:** Ask DevOps team to install cert-manager or provide necessary cluster permissions

#### 6.3 Update Ingress for HTTPS
Modify the ingress resource to include SSL/TLS configuration with automatic certificate generation. Configure proper redirect from HTTP to HTTPS.

#### 6.4 Configure SSL Certificate
Set up SSL certificate for the custom domain using cert-manager. Ensure automatic certificate renewal and proper certificate validation.

#### 6.5 Verify HTTPS Access
Test the application via the custom domain with HTTPS. Verify SSL certificate is valid, all services work over HTTPS, and HTTP redirects properly.

#### 6.6 Update Repository and Documentation
Commit all HTTPS/SSL configuration manifests. Update documentation to include custom domain setup and SSL certificate management instructions.

### Deliverables for Step 6
- Custom domain configured and pointing to ingress
- SSL/TLS certificate automatically managed by cert-manager
- HTTPS access working for both frontend and backend services
- HTTP to HTTPS redirect properly configured
- Updated repository with SSL configuration manifests
- Documentation for domain and certificate management

### Success Criteria
- Application accessible via custom domain with valid HTTPS
- SSL certificate automatically issued and renewed
- All API endpoints work correctly over HTTPS
- Frontend authentication flows work with HTTPS
- HTTP requests automatically redirect to HTTPS
- Certificate status and renewal properly monitored

### 🤖 AI Learning Hints

**Where to start:**
*"I need to learn about HTTPS, SSL certificates, and domain configuration for Kubernetes applications. What are the fundamental concepts of DNS, TLS/SSL, and certificate management I should understand first?"*

**What key points to learn:**
*"I'm setting up a custom domain with HTTPS for my AKS application using cert-manager and Let's Encrypt. What are the essential concepts about DNS configuration, certificate authorities, and automated certificate management?"*

**How to create plan to execute:**
*"Help me plan the setup of a custom domain with HTTPS for my full-stack application in AKS. What's the step-by-step process for DNS configuration, cert-manager installation, and SSL certificate automation?"*

**How to troubleshoot using AI:**
*"My HTTPS setup isn't working - certificate issuance is failing or domain routing has issues. Here's my cert-manager logs and ingress configuration: [paste details]. Help me debug SSL certificate and domain configuration problems."*

*"My SSL certificate isn't being issued. Here's the output from `kubectl describe certificate [cert-name]`, `kubectl logs -n cert-manager [cert-manager-pod]`, and `kubectl get certificaterequests`: [paste output]. What's preventing certificate issuance?"*

*"My domain isn't resolving or HTTPS isn't working. Here's my DNS configuration, output from `nslookup [domain]`, `kubectl get ingress`, and browser SSL error details: [paste information]. Help me debug the domain and SSL setup."*
