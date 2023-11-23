
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
let visitorCount = 0;
const hostname = '127.0.0.1';
const port = 8000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
const cron = require('node-cron');
const nodemailer = require('nodemailer');



// app.get('/user/:username', (req, res) => {
//   console.log("insidedfkhskdhfkjshdfkhsdkj");
//   const username = req.params.username;
//   console.log("inside ", username);
//   if (!req.cookies.visited) {
//     // Increment the visitor count if the visitor is new
//     visitorCount++;

//     // Set a cookie to mark that this user has visited
//     res.cookie('visited', '1', {
//       maxAge: 86400000, // Cookie expires after 24 hours, you can set it as needed
//       httpOnly: true // This helps to prevent XSS attacks
//     });
//   }
//   console.log("total count: ", visitorCount);
//   const filepath = path.resolve(__dirname, `./public/${username}/index.html`);

//   if (filepath) {
//     res.sendFile(path.join(__dirname, 'public', 'samir', 'index.html'));
//   }
//   else {
//     res.send(`This file does not exist`);
//   }
//   // Send a dynamic response based on the username

// })
app.get('/user/:username', async (req, res) => {
  const username = req.params.username;
  const today = new Date().toISOString().slice(0, 10); // format: YYYY-MM-DD
  const cookieName = `visited_${username}`; // Unique cookie name for each user

  // Check if the cookie for the specific user exists and matches today's date
  if (req.cookies[cookieName] !== today) {
    // Increment visitor count and update cookie
    try {
      const countFile = path.join(__dirname, `public/${username}/visitorCount.txt`);
      let visitorCount = 1;

      if (fs.existsSync(countFile)) {
        const currentCount = parseInt(fs.readFileSync(countFile, 'utf8')) || 0;
        visitorCount = currentCount + 1;
      }
      fs.writeFileSync(countFile, visitorCount.toString());

      // Set a new cookie with today's date, scoped to the specific user
      res.cookie(cookieName, today, {
        maxAge: 86400000, // 24 hours
        httpOnly: true,
        path: `/user/${username}` // Scoping the cookie to the specific user path
      });
    } catch (error) {
      console.error("Error updating visitor count:", error);
      // Handle the error as needed
    }
  }
  

  // Serve the user's page
  const filepath = path.join(__dirname, `public/${username}/index.html`);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).send('This file does not exist');
  }
});

app.get('/',(req,res)=>{
    const filepath = path.resolve(__dirname,'./public/index.html');
    console.log("inside got");
    res.sendFile(filepath)
    
})
const createFolder = async(folderName)=>{
    streamName = `public/${folderName}`
    if (!fs.existsSync(streamName)) {
        await fs.mkdirSync(streamName, { recursive: true });
        console.log(`Folder '${streamName}' created successfully.`);
        const sourceDirectory = 'public/wetech';

        // Define an array of file names you want to copy
        const filesToCopy = ['eng.json', 'french.json', 'script.js','style.css'];

        // Loop through the files and copy them to the new stream folder
        for (const file of filesToCopy) {
            const sourceFilePath = path.join(sourceDirectory, file);
            const destinationFilePath = path.join(streamName, file);

            try {
                fs.copyFileSync(sourceFilePath, destinationFilePath);
                console.log(`Copied ${file} to ${streamName}`);
            } catch (err) {
                console.error(`Error copying ${file} to ${streamName}: ${err}`);
            }
        }
    } else {
        console.log(`Folder '${streamName}' already exists.`);
    }
}
// Function to read HTML file and replace placeholders
const getHtmlContent = (stream, image) => {
  const templatePath = path.join(__dirname, 'stream_template.html');
  let htmlContent = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders with dynamic content
  htmlContent = htmlContent.replace(/\$\{stream\}/g, stream);
  htmlContent = htmlContent.replace(/\$\{image\}/g, image);

  return htmlContent;
};

app.post('/submit', async(req, res) => {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const stream = req.body.stream;
    const image = req.body.image;
    const x_imageAdd = "./public/images/x.png"
  const streamPath = path.join(__dirname, `public/${stream}`);
  if (fs.existsSync(streamPath)) {
    return res.status(400).redirect('/404');
  }
    if(stream){
    await createFolder(stream);
    }
    // Create and write data to files
    const file1Content = getHtmlContent(stream, image);

    // Write the modified content to a new file
    // await fs.writeFileSync(`public/${stream}/index.html`, htmlContent);



    await fs.writeFileSync(`public/${stream}/index.html`, file1Content);
    
    
    // Perform validation and further processing as needed
    // For this example, we'll just send a response back
    res.send(`http://localhost:8001/user/${stream}/`);
});
app.get('/404', (req, res) => {
  res.sendFile(path.join(__dirname, './public/404.html'));
});

const gatherVisitorCounts = () => {
  const baseDir = path.join(__dirname, 'public');
  let report = '';

  fs.readdirSync(baseDir).forEach(folder => {
    const countFile = path.join(baseDir, folder, 'visitorCount.txt');
    if (fs.existsSync(countFile)) {
      const count = fs.readFileSync(countFile, 'utf8');
      report += `Folder: ${folder}, Visitors: ${count}\n`;
    }
  });

  return report;
};


const sendEmailReport=require('./sendmail');

cron.schedule('0 0 * * * *', async () => { // This runs every 10 seconds
  const report = gatherVisitorCounts();
  await sendEmailReport(report);
});

app.listen(8001, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
