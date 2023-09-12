# fresco-setup-test

## Deploy your own instance of Fresco

**1. Use the Vercel deploy button to configure your project's deployment in Vercel.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcomplexdatacollective%2FFresco%2Ftree%2Ffeature%2Finitial-setup-flow&env=DATABASE_URL,UPLOADTHING_SECRET,UPLOADTHING_APP_ID)

**2. Create Git Repository**

Follow instructions to create a git repository to deploy from. This will contain a cloned version of this repo.

**3. Configure Project**

Provide required environment variables:

| Variable           | Description                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| DATABASE_URL       | [PlanetScale](https://planetscale.com/)                                                      |
| NEXTAUTH_SECRET    | generate a new secret on the command line with `openssl rand -base64 32`                     |
| NEXTAUTH_URL       | URL to your app                                                                              |
| UPLOADTHING_SECRET | Create a project on [uploadthing](https://uploadthing.com/) and copy the generated API keys. |
| UPLOADTHING_APP_ID |                                                                                              |

**4. Deploy**

Click "Deploy" and wait for the deployment to finish

**5. Create User Account**

Visit your deployed app to create your administrator account. Only one user account may be created.

**Note: For security, you have _five minutes_ from when the app is deployed to create the user account. If this time elapses without a user account created, your configuration will expire. You may redeploy using the same steps.**
