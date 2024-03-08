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

## Step 2

### Fork Fresco Repository

_Prerequisite:_ You need to have a GitHub account. Go to <a href="https://github.com/signup?user_email=&source=form-home-signup" target="_blank"> GitHub</a> and sign up for an account if you do not already have one.

1. On this repository, click the **Fork** button

   ![GitHub - Fork this repository](public/images/readme-screenshots/github-fork1.png)

2. Create your Fork

Enter a repository name (this will be your Fresco instance name), description (optional), and click **Create Fork**.

![Github - Create your fork](public/images/readme-screenshots/github-fork2.png)

This will create a separate instance of the Fresco repository that you can deploy.

## Step 3

### Deploy Forked Repository on Vercel

_Prerequisite:_ You need to have a Vercel account. Go to <a href="https://vercel.com/" target="_blank">vercel.com</a> and sign up for an account.

Sign in to Vercel via your Github account so that you can easily connect your repositories. You can use their "Hobby" tier or paid plan.

1. <a href="https://vercel.com/new" target="_blank">Create a new Project</a>

2. Import Git Repository

Find your Fresco instance from the list of your git repositories and click **Import**.

![Import Git Repository](/public/images/readme-screenshots/vercel2.png)

3. Configure Project.

   Copy the template below and paste it into the Environment Variables section in Vercel to prepopulate the form with the required environment variables.

   Replace the values with your environment variable values from the services you set up in [Step 1](#step-1) and [Step 2](#step-2).

> UPLOADTHING_SECRET=your_uploadthing_api_key\
> UPLOADTHING_APP_ID=your_uploadthing_app_id\
> DISABLE_ANALYTICS=false

| Variable Key | Description |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | |
| UPLOADTHING_SECRET | The API key for your UploadThing app. This is used to authenticate requests from Fresco to the UploadThing API. <a href="https://uploadthing.com/dashboard" target="_blank">More info</a> |
| UPLOADTHING_APP_ID | The unique identifier for your UploadThing app. This is used along with the secret key to identify your app when making requests from Fresco to the UploadThing API. <a href="https://uploadthing.com/dashboard" target="_blank">More info</a> |
| DISABLE_ANALYTICS | A flag to disable the analytics microservice for Fresco. If this is set to `false`, the analytics microservice will be enabled. |

> **_NOTE_**: We use analytics to gather error data from instances of Fresco to troubleshoot issues. By leaving `DISABLE_ANALYTICS` set to `false` (the default) you will help us identify bugs and improve the app.

![Configure Environment Variables](public/images/readme-screenshots/vercel-configure.png)

> **_NOTE_**: When entering the environment variables, do not include the variable keys in the inputs(e.g: `UPLOADTHING_SECRET=`). You should enter the value of the variable which starts after `=` symbol (e.g: `sk_live_xxxx`)

**Also, when providing the environment variables, do not enclose the variable values in quotes. For example:**

✅ Correct:
`mysql://username:password@aws.connect.psdb.cloud/database_name?sslaccept=strict`

❌ Incorrect:
`'mysql://username:password@aws.connect.psdb.cloud/database_name?sslaccept=strict'`

4. Deploy

   Click **"Deploy"** and wait for the deployment to finish.

   > **NOTE**: If you encounter any issues during deployment, check out the [Troubleshooting](#troubleshooting) section or our <a href="https://community.networkcanvas.com/">User Community</a> for a possible solution.

5. Visit your deployed Fresco app by clicking on the preview or go to your dashboard by clicking **"Continue to Dashboard"** button...

   ![Deploy on Vercel3](public/images/readme-screenshots/vercel3.png)

   ...and click on one of the domains names or the **"Visit"** button on the right corner.

   ![Deploy on Vercel4](public/images/readme-screenshots/vercel4.png)

## Step 4

### Create your database

1. From your project dashboard, select _Storage_. Then, select _Create_ within the Postgres row.

![Vercel Database Setup 1](public/images/readme-screenshots/vercel-db-1.png)

2. Review and accept the terms in the modal.

![Vercel Database Setup 2](public/images/readme-screenshots/vercel-db-2.png)

3. Give your database a name and select the region that is closest to where you and your participants will be located. Then, click _Create_. Your database will be generated and you will be redirected to the Getting Started page.

![Vercel Database Setup 3](public/images/readme-screenshots/vercel-db-3.png)

4. You will be prompted to connect your project. Select _Connect_.

![Vercel Database Setup 4](public/images/readme-screenshots/vercel-db-4.png)

5. Select the _Deployments_ tab. Click on the menu beside the most recent deployment and select _Redeploy_. This will redeploy your project with your new connected database.

![Vercel Database Setup 5](public/images/readme-screenshots/vercel-db-5.png)

# Create User Account on Your Fresco App

Visit your deployed app to create your administrator account. Only one user account can be created.

**_NOTE_**: For security, you have **_30 minutes_** from when the app is deployed to create a user account. If this time elapses without a user account being created, your configuration will expire. You would have to [Trigger Redeployment on Your App by Resetting Your Database](#trigger-redeployment-on-your-app-by-resetting-your-database).

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

## Deployment Build Errors and Fixes

- If you encountered the **"Invalid API key"** error...

  ![Deploy error1](public/images/readme-screenshots/deploy-error2.png)

  It means that you provided an incorrect environment variable. Make sure to enter the environment variable value correctly. You must enter the value that starts after `=` symbol
  (e.g: `UPLOADTHING_APP_ID=5q5ybg9dwg`, here `UPLOADTHING_APP_ID` is the key of variable and `5q5ybg9dwg` is the value. You should always enter the value)

## Trigger Redeployment on Your App by Resetting Your Database

Since the expiration state is stored in your PlanetScale database, you need to delete that database and create a new one to be able to trigger redeployment of your Fresco app on Vercel.

1. Navigate to your PlanetScale dashboard, select your database to view its details, and then click on the **"Settings"** tab (refer to the screenshot below).

   ![planetscalse-dashboard5](public/images/readme-screenshots/delete-db1.png)

2. On the Settings tab, scroll down to locate the **"Delete database"** button. Follow the provided instructions to delete your database.

   ![planetscalse-dashboard5](public/images/readme-screenshots/delete-db2.png)

3. Once your database is deleted, create a new one and get the connection URL of the database following the instructions on [Step 1](#step-1). (_Start from stage 4 in Step 1._).

4. When you have the connection URL saved, navigate to the dashboard of your deployed Fresco app on Vercel. You can do this by visiting <a href="https://vercel.com/dashboard" target="_blank">vercel.com/dashboard</a> and selecting your project.

5. In your dashboard, navigate to the **"Settings"** tab. Here, update your database connection URL by pasting the new one and save the changes.

   ![planetscalse-dashboard5](public/images/readme-screenshots/redeploy1.png)

6. Now, navigate to the **"Deployments"** tab and redeploy the app from the main branch.

   ![planetscalse-dashboard5](public/images/readme-screenshots/redeploy2.png)

   ![planetscalse-dashboard5](public/images/readme-screenshots/redeploy3.png)

7. After the build process completes, visit your app and proceed to [Create User Account on Your Fresco App](#create-user-account-on-your-fresco-app) once again.

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

### Which browsers are supported?

Fresco is supported on latest version of Chrome, Safari, and Firefox. This applies to the backend user dashboard and the participant interview experience.
