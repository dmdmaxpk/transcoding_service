const childProcess = require("child_process");
const fs = require('fs');
const builder = require('xmlbuilder');
const axios = require('axios');
const config = require('../config');

let currentDuration = {};   // For storing IDs and duration

exports.transcodeVideo = async (req, res, next) => {

	console.log(`Transcode video: ${req.body.title}`);

    // Step 1 - Running Docker Container
    runDockerCmd(req);

    res.send("Req recieved for transcoding");
}

exports.getStatus = async (req, res, next) => {

    let _id = req.query._id
    console.log(`Current Duration ${currentDuration} for ID: ${_id}`);

    if (currentDuration[_id]) res.send(String(currentDuration[_id]));
    else res.send("0");
}

const runDockerCmd = req => {

    let body = req.body;

    // Creating Docker Command
    let filename = body.file_name;
    let fname = filename.split('.')[0];
    let fextention = filename.split('.')[1];

    let cmd = "docker run --rm -v $PWD:/tmp/workdir jrottenberg/ffmpeg -i " + config.rawContentDir + filename + " ";
   
	let profiles = config.bitrates_profiles;

    // Creating one command for all bitrates
	profiles.forEach( profile => {

		cmd = cmd + " -s " + profile.frame_size +
			" -y -acodec " + profile.audio_codec +
			" -b:a " + profile.audio_bitrate +
			" -ac " + profile.audio_channels +
			" -ar " + profile.audio_sampling +
			" -vcodec " + profile.video_codec +
			" -b:v " + profile.video_bitrate +
			" -vprofile " + profile.video_profile +
			" -level " + profile.level +
			" -g " + profile.gop_size +
			" '" + config.transratedVideosDir + fname + "_" + profile.title + "." + fextention + "' ";
    });
    
    // Setting the dir for each operator
    if (body.operator === 'telenor') cmd = "cd " + config.telenorcontentPath + "; " + cmd;
    if (body.operator === 'zong')    cmd = "cd " + config.zongcontentPath + "; " + cmd;

    console.log("Complete Docker Command-----", cmd);
    console.log("");

    // Starting Docker Container for transcoding
    let child = childProcess.spawn(cmd, {
        shell: true
    });

    let startTime = new Date();
    console.log("Transcoding started for filename: " + body.file_name + " started at: " + startTime);

    child.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    let durationNow;
    let percentComplete; 
    
    // Printing Docker Logs (Must be in stdout, right?)
    child.stderr.on('data', function (data) {
        
        console.log( body.file_name + ": " + data.toString());

        // Calculating transcoding time
        let timeStr = data.toString().match(/time=.{8}/g);      // Parsing time with the next 8 characters for time
        if (timeStr){
            durationNow = timeStr[0].split('=')[1].split(':').reduce((acc,time) => (60 * acc) + +time);     // Converting time string 00:1:03 into into 63 seconds
            percentComplete = parseInt( Number(durationNow) / Number(body.duration) * 100 );    // Current duration divided by total duration gives the %
            console.log(`Completed: ${percentComplete} %`);
            currentDuration[body._id] = percentComplete;
        }
    });

    // On docker exit
    child.on('exit', function() {
        // ext_callback();
        let endTime = new Date();
        let totalTime = (endTime - startTime) / 1000;
        console.log("All bitrates transcoding done for filename: " + body.file_name + " , Total time taken: " + totalTime/60 + ". Total Secs: " + totalTime);
        
        // Step 1 - Copying transcoded files to GCP Mount
        // Log time for copying
        console.time("cptime");
        let copy = childProcess.exec(`cp /qma/telenor/transcoded_videos/${body.file_name.split('.')[0]}* /qma/telenor/gcp_mount`);

        copy.on( 'close', data => {
            console.log( `Transcoded files of ${body.file_name} copied to GCP`);
            console.timeEnd("cptime");
        });
        
        copy.stdout.on( 'data', data => console.log( `stdout: ${data}` ));
        
        copy.stderr.on( 'data', data => console.log( `stderr: ${data}` ));

        // Step 2 - Creating SMIL File (not needed in the Nginx kaltura)
        // createSmilFile(req);

        // Step 3 - Setting Transcoding Status to true
        setTranscodeStatus(req);

        // Delete duration for transcoded video
        delete currentDuration[body._id];
        console.log('Current Duration Obj: ', currentDuration);
    });
}


const createSmilFile = req => {

    let body = req.body;

    let smildir;
    if (body.operator == 'telenor') smildir = config.telenorcontentPath + config.transratedVideosDir;
    if (body.operator == 'zong')    smildir = config.zongcontentPath + config.transratedVideosDir;

    let smilFilePath = smildir + body.file_name.split('.')[0] + ".smil";
    console.log('smilFile DIR: ', smilFilePath);

    let ele_root = builder.create('smil', { encoding: 'UTF-8' });
    ele_root.att('title', body.file_name.split('.')[0]);
    let ele_body = ele_root.ele('body');
    let ele_switch = ele_body.ele('switch');
    
    let { smil_bitrates } = config;
    
    smil_bitrates.forEach( profile => {

        let fname = body.file_name.split('.')[0];
        let fextention = body.file_name.split('.')[1];
        let src = fname + "_" + profile.title + "." + fextention;

        // Setting Video Attributes
        let ele_video = ele_switch.ele('video');
        ele_video.att('width', profile.width);
        ele_video.att('height', profile.height);
        ele_video.att('src', src);
        ele_video.att('systemLanguage', "eng");

        // Setting Video Bitrates
        let ele_param_video = ele_video.ele('param');
        ele_param_video.att('name', "videoBitrate");
        ele_param_video.att('value', profile.video_bitrate);
        ele_param_video.att('valuetype', "data");

        // Setting Audio Bitrates
        let ele_param_audio = ele_video.ele('param');
        ele_param_audio.att('name', "audioBitrate");
        ele_param_audio.att('value', profile.audio_bitrate);
        ele_param_audio.att('valuetype', "data");
    });

    let xmlString = ele_root.end({
        pretty: true,
        indent: '  ',
        newline: '\n',
        allowEmpty: false,
        spacebeforeslash: ''
    });

    console.log("Smil XML:", xmlString);

    let ws = fs.createWriteStream(smilFilePath);

    ws.write(xmlString);
    ws.end();

    ws.on('close', function() {
        console.log("Smil File created for video: " + body.file_name);
    });

}


async function setTranscodeStatus (req) {

    let addr;
    if (req.body.operator == 'telenor') addr = config.telenorVideoServiceAddr;
    if (req.body.operator == 'zong') addr = config.zongVideoServiceAddr;

    let videoServiceUrl = `${addr}/video?_id=${req.body._id}`;
    console.log(videoServiceUrl);

    let result;
    try {
        result = await axios.put(videoServiceUrl, {transcoding_status: true});
        console.log(result.data);
    } catch (error) {
        console.error(error.response);
    }

    console.log("Newly uploaded video is transcoded now. ");

}