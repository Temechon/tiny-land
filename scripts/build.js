var rimraf = require('rimraf');
var fs = require('fs-extra');
var npmRun = require('npm-run');
var zipFolder = require('folder-zip-sync');
var moment = require('moment');
var request = require('request');
var prompt = require('prompt');
var path = require('path');
var ProgressBar = require('progress');
var colors = require('colors');
var git = require('simple-git')('.');
var versiony = require('versiony');

/**
 * Returns the first zip file found in the current directory
 */
var findZip = () => {
    var files = fs.readdirSync('.');
    for (var i in files) {
        if (path.extname(files[i]) === ".zip") {
            return path.basename(files[i]);
        }
    }
}

// * dist folder
//------------
console.log(`- Cleaning dist folder...`.yellow);

// Remove it first
fs.removeSync("dist");

// Then copy the js/libs
fs.copySync("js/libs", "dist/js/libs")

// Remove the whole js folder
fs.removeSync("js");

// And copy back js/libs folder
fs.copySync("dist/js/libs", "js/libs")

// Remove the zip file
var zipToRemove = findZip();
if (zipToRemove) {
    fs.removeSync(zipToRemove);
}

console.log(`- Cleaning dist folder...[OK]`.green);


// * Compilation
//-----------------
console.log(`- Compiling...`.yellow);
try {
    npmRun.execSync('tsc -p tsconfig.json');
} catch (err) {
    console.log(`- Compiling...[KO]`.red);
    console.error(err.stdout.toString());
    process.exit();
}

// * Copy 
// ---------
console.log(`- Coying files to dest folder...`.yellow);

// css
// ! No css for the moment

// js
fs.copySync("js", "dist/js");

// assets
fs.copySync("assets", "dist/assets");


// Fonts
// fs.copySync("fonts", "dist/fonts");

console.log(`- Coying files to dest folder...[OK]`.green);

// * Compression
//--------------
console.log(`- Zipping...`.yellow);

var zipName = `octagons_${moment().format('DD-MM-YYYY')}.zip`;
zipFolder('dist/', zipName);

console.log(`- Zipping...[OK]`.green);

// * Upload
//---------
// console.log(`- Uploading...`.yellow);

// prompt.start();

// var envQuestion = {
//     name: 'env',
//     message: 'Is it PROD environment?',
//     validator: /y[es]*|n[o]?/,
//     warning: 'Must respond yes or no',
//     default: 'no',
//     required: true
// };

// var versionQuestion = {
//     name: 'ver',
//     message: 'Version : [m]ajor or [p]atch?',
//     validator: /m[ajor]*|p[atch]*/,
//     warning: 'Must respond m or p',
//     default: 'p',
//     required: true
// }

// var commentsQuestion = {
//     name: 'comments',
//     message: 'Comments',
//     default: '',
//     required: true
// };

// var uploadQuestion = {
//     name: 'upload',
//     message: 'Upload ?',
//     validator: /y[es]*|n[o]?/,
//     warning: 'Must respond yes or no',
//     default: 'y',
//     required: true
// };

// prompt.get([envQuestion, versionQuestion, commentsQuestion, uploadQuestion], (err, res) => {
//     // Errors ?
//     if (err) {
//         console.log(`- Uploading...[KO]`.red);
//         console.error(err);
//         return;
//     }

//     // Environment
//     let isProd = false;
//     let env = res.env.trim().toLowerCase();
//     if (env === 'y' || env === 'yes') {
//         isProd = true;
//         console.log(`-- Version to update : [PROD]`.green)
//     } else {
//         console.log(`-- Version to update : [DEV]`.red)
//     }

//     // Should upload ?
//     let shouldUpload = false;
//     let upload = res.upload.trim().toLowerCase();
//     if (upload === 'y' || upload === 'yes') {
//         shouldUpload = true;
//         console.log(`-- Game will be uploaded on Facebook`.green)
//     } else {
//         console.log(`-- Game will not be uploaded on Facebook`.red)
//     }


//     // Update package.json version only if prod env
//     let newVersion = '';
//     if (isProd) {
//         console.log(`-- Project version udpated...`.yellow);
//         let isMajor = false;
//         let env = res.ver.trim().toLowerCase();
//         if (env === 'p' || env === 'p') {
//             // Patch
//             newVersion = versiony.from('package.json').newMinor().to().end().version;
//         } else {
//             // Major version
//             newVersion = versiony.from('package.json').newMajor().to().end().version;
//         }
//         console.log(`-- Project version udpated to ${newVersion}`.green);
//     }

//     // Comments
//     let comments = '';
//     if (isProd) {
//         // If prod, add the version
//         comments = newVersion;
//         if (res.comments) {
//             comments += ` - ${res.comments}`;
//         }
//     } else {
//         // Otherwise, just comments
//         comments = `DEV - ${res.comments}`;
//     }

//     // Commit and push on github ONLY FOR PROD
//     if (isProd) {
//         git.add('.').commit(comments, (err, data) => {
//             var commitHash = data.commit;

//             // Write comments in the file    
//             console.log(`\n-- Uppdating versions file...`.yellow);

//             var newVersionText = `${moment().format('DD/MM/YYYY')} - ${commitHash} - ${comments}\n`

//             fs.appendFileSync('versions.md', newVersionText);
//             console.log(`-- Updating versions file...[OK]`.green);

//             // Commit and push the version file on github
//             git.add('versions.md').commit('Version updated').push('origin', 'master')

//         }).push('origin', 'master');
//     } else {
//         // Otherwise, nothing to commit
//         // Write comments in the file    
//         console.log(`\n-- Uppdating versions file...`.yellow);

//         var newVersionText = `${moment().format('DD/MM/YYYY')} - ${comments}\n`

//         fs.appendFileSync('versions.md', newVersionText);
//         console.log(`-- Updating versions file...[OK]`.green);
//     }

//     if (shouldUpload) {

//         // File stream
//         let fileStream = fs.createReadStream(__dirname + '\\..\\' + zipName);
//         let fileSize = fs.lstatSync(__dirname + '\\..\\' + zipName).size;

//         // Upload parameters
//         var formData = {
//             access_token: 'EAAYsfZAxiFmMBADh5ziJhtxdOWHUhivb1ZCAhgaw1IqZByVwXxdr4PkETdp4ZABer4RbkMJycQaZCgyZAlEFymr2ypZBfAmJ4UHtbJ63OOkaBZAsABVZAzuXQrWoZAkM15Q3AtwrJDWBPUYitrCaH12talHThoFOLcZAODZCW66RumpV8QZDZD',

//             type: 'BUNDLE',

//             comment: comments,

//             asset: {
//                 value: fileStream,
//                 options: {
//                     filename: zipName,
//                     contentType: "application/octet-stream"
//                 }
//             }
//         };

//         // Show progress bar
//         var bar = new ProgressBar('Progress [:bar] :percent :etas', {
//             total: fileSize,
//             complete: '=',
//             incomplete: ' ',
//             width: 40
//         });
//         fileStream.on('data', (data) => {
//             bar.tick(data.length);
//         });

//         request.post({ url: 'https://graph-video.facebook.com/2132697456799178/assets', formData: formData }, function optionalCallback(err, httpResponse, body) {
//             if (err) {
//                 console.log(`- Uploading...[KO]`.red);
//                 console.error(err);
//                 return;
//             }
//             console.log(`- Uploading...[OK]`.green);
//             console.log(body);

//         });
//     }

// });