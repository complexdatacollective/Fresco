# Fresco

The Fresco project aims to bring Network Canvas interviews to the web browser. It is a pilot project that does not
add new features to Network Canvas, but rather provides a new way to conduct interviews.

## Known Limitations

- Custom node label workers are not implemented.
- Videos and audio cannot autoplay on load due to browser limitations. Participants must click the play button to start media.
- The 'Use fullscreen forms' visual preference is not supported.
- When exporting data, the "use screen layout coordinates" feature uses a hardcoded screen size of 1920 x 1080. Please note that this does not correspond to the screen size used by your participants.

# Deployment instructions

**1. Set up required servies**

- Create a database with [PlanetScale](https://planetscale.com/docs/tutorials/planetscale-quick-start-guide)
- Create a new app on [uploadthing](https://uploadthing.com/)

**2. Use the Vercel deploy button to configure your project's deployment in Vercel.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcomplexdatacollective%2FFresco%2Ftree%2Ffeature%2Finitial-setup-flow&env=DATABASE_URL,UPLOADTHING_SECRET,UPLOADTHING_APP_ID)

**Note: For security, you have _five minutes_ from when the app is deployed to create a user account. If this time elapses without a user account created, your configuration will expire. You may redeploy using the same steps.**

**3. Create Git Repository**

Follow instructions to create a git repository to deploy from. This will contain a cloned version of this repo.

**4. Configure Project**

Provide required environment variables from the services you set up in Step 1.

| Variable           | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| DATABASE_URL       | [Database connection string](https://planetscale.com/docs/concepts/connection-strings) |
| UPLOADTHING_SECRET | API key for your [uploadthing app](https://uploadthing.com/dashboard)                  |
| UPLOADTHING_APP_ID | App ID for your [uploadthing app](https://uploadthing.com/dashboard)                   |

**5. Deploy**

Click "Deploy" and wait for the deployment to finish

**6. Create User Account**

Visit your deployed app to create your administrator account. Only one user account may be created.
