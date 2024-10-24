# Fresco

The Fresco project aims to bring Network Canvas interviews to the web browser. It is a pilot project that does not
add new features to Network Canvas, but rather provides a new way to conduct interviews.

Read our [documentation](https://documentation.networkcanvas.com/en/fresco) for more information on deploying Fresco.

![Alt](https://repobeats.axiom.co/api/embed/3902b97960b7e32971202cbd5b0d38f39d51df51.svg "Repobeats analytics image")

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

### Step 2: Log in to GitHub Container Registry

Authenticate with the GitHub Container Registry using the token (PAT) you set up above.

- Run `docker login ghcr.io`
- For `username` enter your GitHub username, and for `password` enter the token (PAT) you set up (e.g: `ghp_xxxxxxxxxxxxx`)

### Step 3: Push the Docker Images

After building and tagging your image, push both tags to the GitHub Container Registry.

```bash
docker push ghcr.io/complexdatacollective/fresco:x.y.z
docker push ghcr.io/complexdatacollective/fresco:latest
```

This will upload both the versioned image and the latest image to the GitHub Packages.
Verify the images by visiting GitHub Packages [here](https://github.com/complexdatacollective/Fresco/pkgs/container/fresco)
