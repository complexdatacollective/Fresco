# Fresco

The Fresco project aims to bring Network Canvas interviews to the web browser. It is a pilot project that does not
add new features to Network Canvas, but rather provides a new way to conduct interviews.

## Known Limitations

- Custom node label workers are not implemented.
- Videos and audio cannot autoplay on load due to browser limitations. Participants must click the play button to start media.
- The 'Use fullscreen forms' visual preference is not supported.
- When exporting data, the "use screen layout coordinates" feature uses a hardcoded screen size of 1920 x 1080. Please note that this does not correspond to the screen size used by your participants.

# Deployment Guide

## Step 1

### Set up a database for Fresco with [PlanetScale](https://planetscale.com)

Fresco uses PlanetScale MySQL database platform. It provides scale, performance, and reliability for your data.

1. Go to [planetscale.com](https://planetscale.com).

2. Click on the **"Get started"** button on the right corner.

   ![Planet Scale Get started](public/images/readme-screenshots/planetscale1.png)

3. Sign up for an account using your preferred method and then sign in.

   ![Planet Scale Sign Up](public/images/readme-screenshots/planetscale2.png)

4. Once you entered into your account, click on **"Create a new database"**.

   ![Planet Scale Create Database](public/images/readme-screenshots/planetscale3.png)

5. Create a new database:

   - Enter a name for your database.
   - Choose the plan type that meets your needs (PlanetScale offers free "Hobby" tier that supports 5 GB of storage).

     ![Planet Scale Create Database2](public/images/readme-screenshots/planetscale4.png)

   - Add your card and click **"Create Database"**. PlanetScale requires a credit/debit card information (payments will not be processed unless you change your plan type to Scaler or Scaler Pro later).

     ![Planet Scale Credit card](public/images/readme-screenshots/planetscale5.png)

6. Next, get the connection URL of your database:

   - Connect to your database by selecting Prisma as the framework (as Fresco uses Prisma as an ORM).

     ![Planet Scale Connect to your database](public/images/readme-screenshots/planetscale6.png)

   - Create password for your database (enter password name and click **"Create Password"**).

     ![Planet Scale Create password](public/images/readme-screenshots/planetscale7.png)

   - Enter username and password for your database (using defaults recommended, be sure to save your password in a safe place).

     ![Planet Scale Create password2](public/images/readme-screenshots/planetscale8.png)

   - Do not change any default settings, scroll down and copy the connection URL and save it in a safe place (**this URL is required for connecting to your app on Vercel**).

     ![Planet Scale copy connection URL](public/images/readme-screenshots/planetscale9.png)

   - Finish the process and go to your PlanetScale dashboard by clicking **"Go to your database overview"**.

     ![Planet Scale go to dashboard](public/images/readme-screenshots/planetscale10.png)

For more info, checkout PlanetScale's [Quick Start Guide](https://planetscale.com/docs/tutorials/planetscale-quick-start-guide).

## Step 2

### Create a new app on [UploadThing](https://uploadthing.com/) to store media files

Fresco uses your UploadThing account to store protocol assets, exported files, etc.

1. Go to [uploadthing.com](https://uploadthing.com).

2. Click on the **"Get started"** button.

   ![UploadThing get started](public/images/readme-screenshots/uploadthing1.png)

3. Sign in to your account via Github (If you don't have a Github account, this will prompt you to create one).

   ![UploadThing Sign in to your account](public/images/readme-screenshots/uploadthing2.png)

4. Authorize UploadThing.

   ![UploadThing Authorize UploadThing](public/images/readme-screenshots/uploadthing3.png)

5. You will be prompted to your dashboard. Click on **"Create a new app"** button.

   ![UploadThing prompted to your dashboard](public/images/readme-screenshots/uploadthing4.png)

6. Create your app by giving it a name in the "App Name" section and hit **"Create App"**.

   ![UploadThing Create the app](public/images/readme-screenshots/uploadthing5.png)

7. On your dashboard, go to **"API Keys"** section from the sidebar navigation and copy your API keys (**make sure to save them in a safe place as they are required to deploy Fresco on Vercel**).

   ![UploadThing copy your API keys](public/images/readme-screenshots/uploadthing6.png)

For more info, checkout [UploadThing Docs](https://docs.uploadthing.com/).

## Step 3

### Deploy Fresco on Vercel

_Prerequisite:_ You need to have a Vercel account, go to [vercel.com](https://vercel.com/) and sing up for an account (It's recommended to sign in to Vercel via your Github account. You can use their "Hobby" tier or paid plan.)

1. Use the Vercel **"Deploy"** button to configure your project's deployment on Vercel

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcomplexdatacollective%2FFresco&env=DATABASE_URL,UPLOADTHING_SECRET,UPLOADTHING_APP_ID,MAXMIND_ACCOUNT_ID,MAXMIND_LICENSE_KEY,DISABLE_ANALYTICS)

2. Create Git Repository. Give your repository a name and hit **"Create"** (This will be your Fresco instance name).

   ![Deploy on Vercel1](public/images/readme-screenshots/vercel1.png)

3. Configure Project.

   Provide the required environment variables from the services you set up in [Step 1](#step-1) and [Step 2](#step-2).

   We use Maxmind for getting geo location data for the Fresco analytics microservice. (you can set Maxmind variables as `null`, if you don't want to enable analytics for your app).

   | Variable            | Description                                                                                                                                                                                                                                |
   | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
   | DATABASE_URL        | The connection string for your database. This is used to enable Fresco communicate with your PlanetScale database. [More info](https://planetscale.com/docs/concepts/connection-strings)                                                   |
   | UPLOADTHING_SECRET  | The API key for your UploadThing app. This is used to authenticate requests from Fresco to the UploadThing API. [More info](https://uploadthing.com/dashboard)                                                                             |
   | UPLOADTHING_APP_ID  | The unique identifier for your UploadThing app. This is used along with the secret key to identify your app when making requests from Fresco to the UploadThing API. [More info](https://uploadthing.com/dashboard)                        |
   | MAXMIND_ACCOUNT_ID  | The account ID for your Maxmind account. This is used to authenticate requests to the Maxmind API, which provides IP geolocation and online fraud detection services. [More info](https://www.maxmind.com/en/accounts/970348/license-key/) |
   | MAXMIND_LICENSE_KEY | The license key for your Maxmind account. This is used along with the account ID to authenticate requests to the Maxmind API. [More info](https://www.maxmind.com/en/accounts/970348/license-key/)                                         |
   | DISABLE_ANALYTICS   | A flag to disable the analytics microservice for Fresco. If this is set to `false`, the analytics microservice will be enabled.                                                                                                            |

   **Note: We use Analytics microservice to gather error data from instances of Fresco to troubleshoot issues, so by setting `DISABLE_ANALYTICS` to `false` you would help us identify bugs and improve the app.**

   ![Deploy on Vercel2](public/images/readme-screenshots/vercel2.png)

4. Deploy

   Click **"Deploy"** and wait for the deployment to finish.

   Note: If you encounter any issues during deployment, checkout our [User Community](https://community.networkcanvas.com/) for a possible solution.

5. Visit your deployed app.

   ![Deploy on Vercel3](public/images/readme-screenshots/vercel3.png)

# Create User Account on your Fresco app

Visit your deployed app to create your administrator account. Only one user account may be created.

**Note: For security, you have _5 minutes_ from when the app is deployed to create a user account. If this time elapses without a user account created, your configuration will expire. You may redeploy using the same steps.**

1. Create an account by providing username and password.

   ![Fresco set up 1](public/images/readme-screenshots/fresco1.png)

2. Upload a protocol (this step can be skipped as you can always upload protocols from the dashboard later).

   ![Fresco set up 2](public/images/readme-screenshots/fresco2.png)

3. Configure participation.

   - Import participants (this is optional as you can always import/add participants from the dashboard later).
   - Allow anonymous recruitment (this enables your participants join your study by visiting a URL).

   ![Fresco set up 3](public/images/readme-screenshots/fresco3.png)

4. Click **"Go to the dashboard"** button and begin your exciting exploration of Fresco.

For more info, checkout our [User Community](https://community.networkcanvas.com/).
