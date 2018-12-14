const env = process.env.NODE_ENV || 'development';

let config = {
    development: {
        port: '3000',
    },
    staging: {
        port: '3000',
    },
    production: {
        port: '3011',
    }
};

console.log("---", env);

if (env === 'development')      config = config.development;
if (env === 'staging')          config = config.staging;
if (env === 'production')       config = config.production;

// Common configs
config.rawContentDir = "videos/";
config.transratedVideosDir = "transcoded_videos/";     //Directory for final transcoded videos.

// Telenor
config.telenorcontentPath = "/qma/telenor/";
config.telenorVideoServiceAddr = 'http://10.3.7.101:3000';

// Zong
config.zongcontentPath = "/qma/zong/";
config.zongVideoServiceAddr = 'http://10.0.1.93:3000';

// VODs bitrate settings
config.bitrates_profiles = [
    {
        "title": "main_480",
        "audio_bitrate": "128k",
        "audio_channels": 2,
        "audio_codec": "aac",
        "audio_sampling": 48000,
        "description": "Medium HD quality bitrate 480.",
        "frame_size": "854x480",
        "gop_size": 48,
        "level": 30,
        "video_bitrate": 550000,
        "video_codec": "libx264",
        "video_profile": "main"
    },
    {
        "title": "main_360",
        "audio_bitrate": "64k",
        "audio_channels": 2,
        "audio_codec": "aac",
        "audio_sampling": 48000,
        "description": "Good quality bitrate 360.",
        "frame_size": "640x360",
        "gop_size": 48,
        "level": 30,
        "video_bitrate": 400000,
        "video_codec": "libx264",
        "video_profile": "main"
    },
    {
        "title": "baseline_144",
        "audio_bitrate": "64k",
        "audio_channels": 2,
        "audio_codec": "aac",
        "audio_sampling": 48000,
        "description": "Low bitrate 144.",
        "frame_size": "256x144",
        "gop_size": 48,
        "level": 30,
        "video_bitrate": 200000,
        "video_codec": "libx264",
        "video_profile": "baseline"
    }
];

// Final bandwidth of playlist files depends on video + audio bitrates combined
config.smil_bitrates = [
    {
        "title": "baseline_144",
        "width": 256,
        "height": 144,
        "video_bitrate": 256000,
        "audio_bitrate": 64000
    },
    {
        "title": "main_360",
        "width": 640,
        "height": 360,
        "video_bitrate": 896000,
        "audio_bitrate": 64000
    }
];

module.exports = config;
