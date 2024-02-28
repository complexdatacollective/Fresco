# Fresco

The Fresco project aims to bring Network Canvas interviews to the web browser. It is a pilot project that does not
add new features to Network Canvas, but rather provides a new way to conduct interviews.

## Known Issues

- Custom node label workers are not implemented.
- Videos and audio cannot autoplay on first load due to browser limitations. Participants must have interacted with the interview before media can autoplay.
- The 'Use fullscreen forms' visual preference is not supported.
- When exporting data, the "use screen layout coordinates" feature uses a hardcoded screen size of 1920 x 1080. Please note that this does not correspond to the screen size used by your participants.

# Deployment Guide

## Step 1

### Set up a database for Fresco with PlanetScale

Fresco uses PlanetScale MySQL database platform. It provides scale, performance, and reliability for your data.

1. Go to <a href="https://planetscale.com" target="_blank">planetscale.com</a>.

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

> **_NOTE_**: If you couldn't find and copy the connection URL using the above instructions, see the bellow guide on how to [Get database connection URL from PlanetScale dashboard](#get-database-connection-url-from-planetscale-dashboard)**

For more info, checkout PlanetScale's <a href="https://planetscale.com/docs/tutorials/planetscale-quick-start-guide" target="_blank">Quick Start Guide</a>.

## Step 2

### Create a new app on UploadThing to store media files

Fresco uses your UploadThing account to store protocol assets, exported files, etc.

1. Go to <a href="https://uploadthing.com" target="_blank">uploadthing.com</a>.

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

For more info, check out <a href="https://docs.uploadthing.com" target="_blank">UploadThing Docs</a>.

## Step 3

### Fork Fresco Repository

_Prerequisite:_ You need to have a GitHub account. Go to <a href="https://github.com/signup?user_email=&source=form-home-signup" target="_blank"> GitHub</a> and sign up for an account if you do not already have one.

1. On this repository, click the **Fork** button

   ![GitHub - Fork this repository](public/images/readme-screenshots/github-fork1.png)

2. Create your Fork

Enter a repository name (this will be your Fresco instance name), description (optional), and click **Create Fork**. 
   
   ![Github - Create your fork](public/images/readme-screenshots/github-fork2.png)

This will create a separate instance of the Fresco repository that you can deploy. 

## Step 4

### Deploy Forked Repository on Vercel

_Prerequisite:_ You need to have a Vercel account. Go to <a href="https://vercel.com/" target="_blank">vercel.com</a> and sign up for an account.

Sign in to Vercel via your Github account so that you can easily connect your repositories. You can use their "Hobby" tier or paid plan.

1. From the <a href="https://vercel.com/dashboard" target="_blank">Vercel Dashboard</a>, click **Add new...** and select **Project** from the dropdown.

   ![Add new project on Vercel](/public/images/readme-screenshots/vercel1.png)

2. Import Git Repository

Find your Fresco instance from the list of your git repositories and click **Import**.

   ![Import Git Repository](/public/images/readme-screenshots/vercel2.png)

3. Configure Project.

   Provide the required environment variables from the services you set up in [Step 1](#step-1) and [Step 2](#step-2).

   | Variable           | Description                                                                                                                                                                                                                                    |
   | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | DATABASE_URL       | The connection string for your database. This is used to enable Fresco communicate with your PlanetScale database. <a href="https://planetscale.com/docs/concepts/connection-strings" target="_blank">More info</a>                            |
   | UPLOADTHING_SECRET | The API key for your UploadThing app. This is used to authenticate requests from Fresco to the UploadThing API. <a href="https://uploadthing.com/dashboard" target="_blank">More info</a>                                                      |
   | UPLOADTHING_APP_ID | The unique identifier for your UploadThing app. This is used along with the secret key to identify your app when making requests from Fresco to the UploadThing API. <a href="https://uploadthing.com/dashboard" target="_blank">More info</a> |
   | DISABLE_ANALYTICS  | A flag to disable the analytics microservice for Fresco. If this is set to `false`, the analytics microservice will be enabled.                                                                                                                |

   > **_NOTE_**: We use analytics to gather error data from instances of Fresco to troubleshoot issues. By leaving `DISABLE_ANALYTICS` set to `false` (the default) you will help us identify bugs and improve the app.**

   ![Deploy on Vercel2](public/images/readme-screenshots/vercel-configure.png)

  >  **_NOTE_**: When entering the environment variables, do not include the variable keys in the inputs(e.g: `UPLOADTHING_SECRET=`). You should enter the value of the variable which starts after `=` symbol (e.g: `sk_live_xxxx`)**

   **Also, when providing the environment variables, do not enclose the variable values in quotes. For example:**

   ✅ Correct:
   `mysql://username:password@aws.connect.psdb.cloud/database_name?sslaccept=strict`

   ❌ Incorrect:
   `'mysql://username:password@aws.connect.psdb.cloud/database_name?sslaccept=strict'`

4. Deploy

   Click **"Deploy"** and wait for the deployment to finish.

   > **NOTE**: If you encounter any issues during deployment, check out the [Troubleshooting](#troubleshooting) section or our <a href="https://community.networkcanvas.com/">User Community</a> for a possible solution.**

5. Visit your deployed Fresco app by clicking on the preview or go to your dashboard by clicking **"Continue to Dashboard"** button...

   ![Deploy on Vercel3](public/images/readme-screenshots/vercel3.png)

   ...and click on one of the domains names or the **"Visit"** button on the right corner.

   ![Deploy on Vercel4](public/images/readme-screenshots/vercel4.png)

# Create User Account on your Fresco app

Visit your deployed app to create your administrator account. Only one user account can be created.

> **_NOTE_**: For security, you have _5 minutes_ from when the app is deployed to create a user account. If this time elapses without a user account being created, your configuration will expire. You may redeploy using the same steps.**

1. Create an account by providing a username and password.

   ![Fresco set up 1](public/images/readme-screenshots/fresco1.png)

2. Upload a protocol (this step can be skipped as you can always upload protocols from the dashboard later).

   ![Fresco set up 2](public/images/readme-screenshots/fresco2.png)

3. Configure participation.

   - Import participants (this is optional as you can always import/add participants from the dashboard later).
   - Allow anonymous recruitment (this enables your participants join your study by visiting a URL).

   ![Fresco set up 3](public/images/readme-screenshots/fresco3.png)

4. Click the **"Go to the dashboard"** button and begin your exciting exploration of Fresco.

For more info, check out our <a href="https://community.networkcanvas.com/">User Community</a>.

# Troubleshooting

## Deployment build errors and fixes

- If you encountered the **"Invalid API key"** error...

  ![Deploy error1](public/images/readme-screenshots/deploy-error2.png)

  It means that you provided an incorrect environment variable. Make sure to enter the environment variable value correctly. You must enter the value that starts after `=` symbol
  (e.g: `UPLOADTHING_APP_ID=5q5ybg9dwg`, here `UPLOADTHING_APP_ID` is the key of variable and `5q5ybg9dwg` is the value. You should always enter the value)

- If you encountered the error below...

  ![Deploy error1](public/images/readme-screenshots/deploy-error1.png)

  It means that you have not entered the correct database connection string and you need to copy it again from your PlanetScale dashboard, see the below instructions for that.

### Get database connection URL from PlanetScale dashboard

1. Go to your dashboard and click on your database.

   ![planetscalse-dashboard1](public/images/readme-screenshots/planetscalse-dashboard1.png)

2. This is the main view to manage your database. Click on the **"Connect"** button on the right corner.

   ![planetscalse-dashboard2](public/images/readme-screenshots/planetscalse-dashboard2.png)

3. Since PlanetScale doesn't reveal your database password for security purposes, you need to create a new username and password for your database to generate a new database connection string. Click on the **"New password"** button for that.

   ![planetscalse-dashboard3](public/images/readme-screenshots/planetscalse-dashboard3.png)

4. Leave everything as default and hit the **"Create password"** button.

   ![planetscalse-dashboard4](public/images/readme-screenshots/planetscalse-dashboard4.png)

5. You will be prompted back to the first view. Choose **"Prisma"** as the framework if you haven't already and hit the copy button on the right corner (save your database string in a safe place and use it to deploy Fresco on Vercel)

   ![planetscalse-dashboard5](public/images/readme-screenshots/planetscalse-dashboard5.png)

> **_NOTE_**: The database connection variable should begin with `mysql://` and look like this: `mysql://username:password@aws.connect.psdb.cloud/database_name?sslaccept=strict`**

# Upgrade Guide

Fresco is Alpha software and will be continuously improved. As we release updated versions of Fresco, you can upgrade your deployed instance using this guide.

## Step 1

### Sync Fork

From your GitHub repository, click **Sync Fork** and select **Update Branch**. 

   ![sync-fork](public/images/readme-screenshots/sync-fork.png)

Vercel will automatically begin redeploying your Fresco instance. This process will take a few minutes to complete. 

## FAQ

### Where will announcements about releases be posted?

New versions of Fresco will be announced on our <a href="https://community.networkcanvas.com/" target="_blank">User Community</a>.


