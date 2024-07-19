# Fresco

The Fresco project aims to bring Network Canvas interviews to the web browser. It is a pilot project that does not
add new features to Network Canvas, but rather provides a new way to conduct interviews.

Read our [documentation](https://documentation.networkcanvas.com/en/fresco) for more information on deploying Fresco.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcomplexdatacollective%2Ffresco%2Ftree%2Fmain&project-name=fresco&repository-name=fresco&demo-title=Network%20Canvas%20Fresco&demo-description=The%20Fresco%20project%20brings%20Network%20Canvas%20interviews%20to%20the%20web%20browser.%20See%20the%20Network%20Canvas%20project%20documentation%20website%20for%20more%20information.&demo-url=https%3A%2F%2Ffresco-sandbox.networkcanvas.com%2F&demo-image=https%3A%2F%2Fdocumentation.networkcanvas.com%2Fassets%2Fimg%2Ffresco-images%2Ffeatures%2Fdashboard.png&stores=%5B%7B"type"%3A"postgres"%7D%5D&env=UPLOADTHING_SECRET,UPLOADTHING_APP_ID&envDescription=The%20Uploadthing%20secret%20key%20and%20app%20ID%20let%20Fresco%20securely%20communicate%20with%20your%20data%20storage%20bucket.&envLink=https%3A%2F%2Fuploadthing.com%2Fdashboard%2F)

## Building and Publishing Docker Images

This guide outlines the steps for building and publishing Docker images for Fresco to GitHub Packages with `:x.y.z` and `:latest` tags.

### Prerequisites

- Docker installed on your machine.
- A GitHub account and a Personal Access Token (PAT) with `write:packages`, `read:packages`, and `delete:packages` permissions (You can set up PAT [here](https://github.com/settings/tokens)).

### Step 1: Build the Docker Image

Navigate to the directory containing your Dockerfile and run the following command to build your Docker image with both the version tag and the `latest` tag:

```bash
docker build -t ghcr.io/complexdatacollective/fresco:x.y.z -t ghcr.io/complexdatacollective/fresco:latest .
```

**NOTE: The image name must be in this pattern `ghcr.io/complexdatacollective/fresco:tag` otherwise GitHub container registry won't accept the image. Also, don't forget to replace `x.y.z` with appropriate version you want**

## Step 2: Log in to GitHub Container Registry

Authenticate with the GitHub Container Registry using the token (PAT) you set up above.

- Run `docker login ghcr.io`
- For `username` enter your GitHub username, and for `password` enter the token (PAT) you set up (e.g: `ghp_xxxxxxxxxxxxx`)

## Step 3: Push the Docker Images

After building and tagging your image, push both tags to the GitHub Container Registry.

```bash
docker push ghcr.io/complexdatacollective/fresco:x.y.z
docker push ghcr.io/complexdatacollective/fresco:latest
```

This will upload both the versioned image and the latest image to the GitHub Packages.
Verify the images by visiting GitHub Packages [here](https://github.com/complexdatacollective/Fresco/pkgs/container/fresco)
