import { hash } from 'bcrypt';
import { prisma } from "~/utils/db"

async function main() {
  const password = await hash('password', 8)

  await prisma.user.upsert({
    where: { email: 'admin@networkcanvas.com' },
    update: {},
    create: {
      name: 'Test Admin User',
      email: 'admin@networkcanvas.com',
      password,
      roles: {
        create: [{
          id: '1',
          name: 'ADMIN',
        }],
      },
      protocols: {
        create: [{
          name: 'Test Protocol',
          hash: 'test-protocol',
          schemaVersion: '7',
          description: 'This is a test protocol',
          assetPath: 'assets/path',
          importedAt: '2023-05-09T16:35:55Z',
          lastModified: '2023-05-09T16:35:55Z',
          data: "{\"stages\":[{\"label\":\"InformationInterface\",\"type\":\"Information\",\"title\":\"InformationInterface\",\"items\":[{\"size\":\"MEDIUM\",\"id\":\"176d0f5a-132c-45b9-b542-8f7b7a83e71b\",\"content\":\"Thescreenyouarecurrentlyviewingwasbuiltusingthe**InformationInterface**withinArchitect.\\n\\nUnlikeotherinterfaces,thisinterfacecapturesnodatafromtheparticipant.Instead,researchersareabletoincludeexplanatory**text**and**image**,**audio**,and**video**filestoassistintheadministrationofNetworkCanvasInterviews.\\n\\nWhilethesescreensarehelpfulinguidinginterviews,itshouldbenotedthatInterviewerhasbeendesignedtoconductinterviewsinaface-to-facesetting,wheretasksoneachscreenareabletobefullyexplainedtotheparticipantbytheresearcher.\\n\",\"type\":\"text\"},{\"size\":\"SMALL\",\"id\":\"74fab225-4b5d-42cb-b01b-d220d7158e8a\",\"content\":\"89aab5e0-8cc9-43de-b564-770aafa87b28\",\"type\":\"asset\"}],\"id\":\"426884b0-3594-11eb-8030-7590bae3c8d1\"},{\"label\":\"EgoForm\",\"type\":\"EgoForm\",\"introductionPanel\":{\"title\":\"ConventionalEgoDataCollectionExample\",\"text\":\"Thisscreenshowsanexampleofamoreconventionalparticipant-leveldatacollectionform.Notethecollectionofmanydifferenttypesofdata,andtheuseoftouchoptimizedinputcontrolsalongsidemorefamiliartextentry.\\n\\nInterviewerisnotintendedtoreplacededicatedparticipant-levelsurveytools.However,itcanbeusedtocollectbasicegodata,andisespeciallyusefulifyouneedtocollectinformationthatcanlinkyourparticipanttosurveydatacollectedthroughadifferentplatform.\\n\"},\"form\":{\"fields\":[{\"variable\":\"4ab18994-a252-47cb-ba19-20b6ffc0e927\",\"prompt\":\"Whatisyourfirstname?\"},{\"variable\":\"3b5197a9-d024-421c-8663-1e06e0587999\",\"prompt\":\"Whatisyourlastname?\"},{\"variable\":\"198bdb95-9556-4775-9c82-22531a382aa5\",\"prompt\":\"Whatisyourdateofbirth?\"},{\"variable\":\"92326a8e-f5a1-4918-8717-a4d6917a9264\",\"prompt\":\"Whichofthefollowinglanguagesdoyouspeakfluently?\"},{\"variable\":\"aa418971-ce17-4f0f-8060-438197298a82\",\"prompt\":\"Overall,howsatisfiedareyouwithexistingsocialnetworkanalysissoftware?\"},{\"variable\":\"d2ac00d6-337a-4ce4-87de-028eccd81617\",\"prompt\":\"Howsatisfiedareyouwiththelevelofsupportyoureceive?\"},{\"variable\":\"3609188b-dfbe-482a-995c-d71387e22054\",\"prompt\":\"Thinkingbacktoyourlastmedicalprocedure,howmuchpaindoyoufeelyouexperienced?\"},{\"variable\":\"835ea5b5-1fbf-472d-ad3a-df74ec1d6870\",\"prompt\":\"Howwouldyouprefertobecontactedaboutyournextinterview?\"},{\"variable\":\"5a77b483-8120-4a64-aff1-c8c5d4ac33d1\",\"prompt\":\"Isthereanyotherinformationyouwouldliketoprovideatthistime?\"}]},\"id\":\"e922f680-32ee-11eb-8503-3b4fa95b8bc6\"},{\"label\":\"QuickAddNameGenerator\",\"type\":\"NameGeneratorQuickAdd\",\"subject\":{\"entity\":\"node\",\"type\":\"3d5c30be-e733-490e-868d-fcc0dc3d5a4d\"},\"quickAdd\":\"c7053a78-bcd5-44bb-bfca-36c8aefa793f\",\"prompts\":[{\"id\":\"ef3a3de1-b986-472a-a074-1b42634680dd\",\"text\":\"Withinthe**past6months**,whohaveyoufelt**closeto**,ordiscussed**importantpersonalmatters**with?\"}],\"id\":\"f6cff4b0-32e7-11eb-8503-3b4fa95b8bc6\"}],\"codebook\":{\"node\":{\"3d5c30be-e733-490e-868d-fcc0dc3d5a4d\":{\"color\":\"node-color-seq-1\",\"variables\":{\"c7053a78-bcd5-44bb-bfca-36c8aefa793f\":{\"name\":\"name\",\"type\":\"text\"}},\"name\":\"Person\",\"iconVariant\":\"add-a-person\"}},\"ego\":{\"variables\":{\"4ab18994-a252-47cb-ba19-20b6ffc0e927\":{\"type\":\"text\",\"component\":\"Text\",\"validation\":{\"required\":true},\"name\":\"first_name\"},\"3b5197a9-d024-421c-8663-1e06e0587999\":{\"type\":\"text\",\"component\":\"Text\",\"validation\":{\"required\":true},\"name\":\"last_name\"},\"198bdb95-9556-4775-9c82-22531a382aa5\":{\"type\":\"datetime\",\"component\":\"DatePicker\",\"parameters\":{\"type\":\"full\",\"max\":\"2002-01-01\"},\"name\":\"dob\"},\"92326a8e-f5a1-4918-8717-a4d6917a9264\":{\"type\":\"categorical\",\"component\":\"ToggleButtonGroup\",\"options\":[{\"label\":\"English\",\"value\":\"english\"},{\"label\":\"MandarinChinese\",\"value\":\"mandarin-chinese\"},{\"label\":\"Hindi\",\"value\":\"hindi\"},{\"label\":\"Spanish\",\"value\":\"spanish\"},{\"label\":\"French\",\"value\":\"french\"},{\"label\":\"Arabic\",\"value\":\"arabic\"},{\"label\":\"Bengali\",\"value\":\"bengali\"},{\"label\":\"Russian\",\"value\":\"russian\"}],\"name\":\"languages_spoken\"},\"aa418971-ce17-4f0f-8060-438197298a82\":{\"type\":\"ordinal\",\"component\":\"RadioGroup\",\"options\":[{\"label\":\"VerySatisfied\",\"value\":5},{\"label\":\"SomewhatSatisfied\",\"value\":4},{\"label\":\"NeitherSatisfiedorDissatisfied\",\"value\":3},{\"label\":\"SomewhatDissatisfied\",\"value\":2},{\"label\":\"VeryDissatisfied\",\"value\":1}],\"name\":\"existing_software\"},\"d2ac00d6-337a-4ce4-87de-028eccd81617\":{\"type\":\"ordinal\",\"component\":\"LikertScale\",\"options\":[{\"label\":\"VerySatisfied\",\"value\":2},{\"label\":\"SomewhatSatisfied\",\"value\":1},{\"label\":\"NeitherSatisfiedorDissatisfied\",\"value\":0},{\"label\":\"SomewhatDissatisfied\",\"value\":-1},{\"label\":\"VeryDissatisfied\",\"value\":-2}],\"name\":\"research_support\"},\"3609188b-dfbe-482a-995c-d71387e22054\":{\"type\":\"scalar\",\"component\":\"VisualAnalogScale\",\"parameters\":{\"minLabel\":\"Nopain\",\"maxLabel\":\"Unbearablepain\"},\"name\":\"operation_pain\"},\"5a77b483-8120-4a64-aff1-c8c5d4ac33d1\":{\"type\":\"text\",\"component\":\"TextArea\",\"name\":\"other_info\"},\"835ea5b5-1fbf-472d-ad3a-df74ec1d6870\":{\"type\":\"categorical\",\"component\":\"CheckboxGroup\",\"options\":[{\"label\":\"Email\",\"value\":\"email\"},{\"label\":\"Post\",\"value\":\"post\"},{\"label\":\"SMS\",\"value\":\"sms\"},{\"label\":\"Phonecall\",\"value\":\"phone\"}],\"name\":\"preferred_contact_method\"}}}},\"assetManifest\":{\"89aab5e0-8cc9-43de-b564-770aafa87b28\":{\"id\":\"89aab5e0-8cc9-43de-b564-770aafa87b28\",\"type\":\"image\",\"name\":\"NC-TypeandMarkPos@4x.png\",\"source\":\"0a85f140-32e2-11eb-8503-3b4fa95b8bc6.png\"},\"d94b5dae-4ed5-42bf-9d1c-b6585fbe078d\":{\"id\":\"d94b5dae-4ed5-42bf-9d1c-b6585fbe078d\",\"type\":\"network\",\"name\":\"world-universities.csv\",\"source\":\"862d52c0-32ec-11eb-8503-3b4fa95b8bc6.csv\"},\"86b7feeb-b71a-4c15-8eb4-25a75491d512\":{\"id\":\"86b7feeb-b71a-4c15-8eb4-25a75491d512\",\"type\":\"network\",\"name\":\"classroster.csv\",\"source\":\"a3cf6c90-32ed-11eb-8503-3b4fa95b8bc6.csv\"},\"ed673344-caac-4702-b029-7fa4b842af75\":{\"id\":\"ed673344-caac-4702-b029-7fa4b842af75\",\"type\":\"image\",\"name\":\"political-compass@4x.png\",\"source\":\"2946e670-3e45-11eb-ac1c-7b8de3fada93.png\"},\"9e85e738-ebd3-40d5-952e-62f6aef95615\":{\"id\":\"9e85e738-ebd3-40d5-952e-62f6aef95615\",\"type\":\"video\",\"name\":\"01.mov\",\"source\":\"1193f170-3ef5-11eb-9463-ef503e14de0c.mov\"},\"a1f8d707-c9f2-4990-a544-8cf1148c8ad4\":{\"id\":\"a1f8d707-c9f2-4990-a544-8cf1148c8ad4\",\"type\":\"video\",\"name\":\"02.mov\",\"source\":\"8f010350-3ef5-11eb-9463-ef503e14de0c.mov\"},\"fd0ec703-7091-448d-a3ff-ec40a6e0256d\":{\"id\":\"fd0ec703-7091-448d-a3ff-ec40a6e0256d\",\"type\":\"video\",\"name\":\"03.mov\",\"source\":\"d0900b30-3ef6-11eb-9463-ef503e14de0c.mov\"},\"02a6cd2a-8ca1-4126-a847-b3913b312ad4\":{\"id\":\"02a6cd2a-8ca1-4126-a847-b3913b312ad4\",\"type\":\"video\",\"name\":\"05.mov\",\"source\":\"27bad7e0-3ef8-11eb-9463-ef503e14de0c.mov\"},\"1b5d57eb-f86c-4e7d-b8a8-9b4d09e821f4\":{\"id\":\"1b5d57eb-f86c-4e7d-b8a8-9b4d09e821f4\",\"type\":\"video\",\"name\":\"06.mov\",\"source\":\"51a06610-3ef8-11eb-9463-ef503e14de0c.mov\"},\"f502aa5b-13d3-400f-97fa-2c363d076478\":{\"id\":\"f502aa5b-13d3-400f-97fa-2c363d076478\",\"type\":\"video\",\"name\":\"07.mov\",\"source\":\"e0d7e970-3ef8-11eb-9463-ef503e14de0c.mov\"}},\"schemaVersion\":7,\"description\":\"ThisisademonstrationprotocoldesignedtoillustratethefeaturesoftheNetworkCanvasInterviewerapp\",\"lastModified\":\"2023-05-09T16:05:31.161Z\"}",
          interviews: {
            //create: [{
              //id: '1',
              //name: 'Test Interview',
             // startTime: '2023-05-09T16:35:55Z',
              //lastUpdated: '2023-05-09T16:35:55Z',
              //network: 'network',
            //}],
          },
        }]
      }
    },
  })

  await prisma.user.upsert({
    where: { email: 'participant@networkcanvas.com' },
    update: {},
    create: {
      name: 'Test Participant User',
      email: 'participant@networkcanvas.com',
      password,
      roles: {
        create: [{
          id: '2',
          name: 'PARTICIPANT',
        }],
      },
    },
  })
  

}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
