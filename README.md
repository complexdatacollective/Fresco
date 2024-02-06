# Fresco

The Fresco project aims to bring Network Canvas interviews to the web browser. It is a pilot project that does not
add new features to Network Canvas, but rather provides a new way to conduct interviews.

## Known Limitations

- Custom node label workers are not implemented.
- Videos and audio cannot autoplay on load due to browser limitations. Participants must click the play button to start media.
- The 'Use fullscreen forms' visual preference is not supported.
- When exporting data, the "use screen layout coordinates" feature uses a hardcoded screen size of 1920 x 1080. Please note that this does not correspond to the screen size used by your participants.

# Deployment instructions

## 1. Set up a database for Fresco with [PlanetScale](https://planetscale.com)

1. Go to [planetscale.com](planetscale.com).

2. Click on the **"Get started"** button on the right corner.

   ![Planet Scale Get started](public/images/readme-screenshots/planetscale1.png)

3. Sign up for an account using your preferred method and then sign in.

   ![Planet Scale Sign Up](public/images/readme-screenshots/planetscale2.png)

4. Once you entered into your account, click on **"Create a new database"**.

   ![Planet Scale Create Database](public/images/readme-screenshots/planetscale3.png)

5. Create a new database:

   - Enter a name for your database
   - Choose the plan type that meets your needs (PlanetScale offers free "Hobby" tier that supports 5 GB of storage)

     ![Planet Scale Create Database2](public/images/readme-screenshots/planetscale4.png)

   - Add your card and click **"Create Database"**. PlanetScale requires a credit/debit card information (payments will not be processed unless you change your plan type to Scaler or Scaler Pro later).

     ![Planet Scale Credit card](public/images/readme-screenshots/planetscale5.png)

6. Next:

   - Connect to your database by selecting Prisma as the framework (because Fresco uses Prisma as an ORM)

     ![Planet Scale Connect to your database](public/images/readme-screenshots/planetscale6.png)

   - Create password for your database (enter password name and click **"Create Password"**)

     ![Planet Scale Create password](public/images/readme-screenshots/planetscale7.png)

   - Enter username and password for your database (using defaults recommended, be sure to save your password in a safe place)

     ![Planet Scale Create password2](public/images/readme-screenshots/planetscale8.png)

   - Do not change any default settings, scroll down and copy the whole connection URL including "DATABASE_URL" and save it in a safe place (this URL is required for connecting to your app on Vercel)

     ![Planet Scale copy connection URL](public/images/readme-screenshots/planetscale9.png)

   - Finish the process and go to your PlanetScale dashboard by clicking **"Go to your database overview"**

     ![Planet Scale go to dashboard](public/images/readme-screenshots/planetscale10.png)

For more info checkout PlanetScale's [Quick Start Guide](https://planetscale.com/docs/tutorials/planetscale-quick-start-guide)

## 2. Create a new app on [UploadThing](https://uploadthing.com/) to store media files

1. Go to [uploadthing.com](https://uploadthing.com).

2. Click on the **"Get started"** button.

   ![UploadThing get started](public/images/readme-screenshots/uploadthing1.png)

3. Sign in to your account via Github (If you don't have a Github account, this will prompt you to create one).

   ![UploadThing Sign in to your account](public/images/readme-screenshots/uploadthing2.png)

4. Authorize UploadThing

   ![UploadThing Authorize UploadThing](public/images/readme-screenshots/uploadthing3.png)

5. You will be prompted to your dashboard. Click on **"Create a new app"** button.

   ![UploadThing prompted to your dashboard](public/images/readme-screenshots/uploadthing4.png)

6. Create your app by giving it a name in the "App Name" section and hit **"Create App"**

   ![UploadThing Create the app](public/images/readme-screenshots/uploadthing5.png)

7. On your dashboard, go to **"API Keys"** section from the sidebar navigation and copy your API keys (make sure to save them in a safe place as they are required to deploy Fresco on Vercel)

   ![UploadThing copy your API keys](public/images/readme-screenshots/uploadthing6.png)

For more info checkout [UploadThing Docs](https://docs.uploadthing.com/)

## 3. Deploy Fresco on Vercel.

1. Use the Vercel **"Deploy"** button to configure your project's deployment on Vercel
   Note: The button prompts you to sign in to your Vercel account if you don't have an account. Create an account on Vercel with a "Hobby" or paid tier and click the **"Deploy"** button again

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcomplexdatacollective%2FFresco%2Ftree%2Ffeature%2Finitial-setup-flow&env=DATABASE_URL,UPLOADTHING_SECRET,UPLOADTHING_APP_ID)

2. Create Git Repository. Follow instructions to create a git repository to deploy from. This will contain a cloned version of this repo.

3. Configure Project

Provide required environment variables from the services you set up in Step 1 and Step 2.

| Variable           | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| DATABASE_URL       | [Database connection string](https://planetscale.com/docs/concepts/connection-strings) |
| UPLOADTHING_SECRET | API key for your [uploadthing app](https://uploadthing.com/dashboard)                  |
| UPLOADTHING_APP_ID | App ID for your [uploadthing app](https://uploadthing.com/dashboard)                   |

4. Deploy

Click "Deploy" and wait for the deployment to finish

5. Create User Account

Visit your deployed app to create your administrator account. Only one user account may be created.

**Note: For security, you have _five minutes_ from when the app is deployed to create a user account. If this time elapses without a user account created, your configuration will expire. You may redeploy using the same steps.**
