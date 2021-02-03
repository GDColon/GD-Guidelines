const fs = require('fs')
const zlib = require('zlib')

let colors = {o: 0.8, y: 0.9, g: 1.0}
let gdLevels = process.env.HOME || process.env.USERPROFILE + "/AppData/Local/GeometryDash/CCLocalLevels.dat"
let levelRegex = /(<k>k_0<\/k>.+?<k>k4<\/k><s>)(.+?)<\/s>/

let localLevels = fs.readFileSync(gdLevels, 'utf8')
console.log("Reading save...")

if (!localLevels.startsWith('<?xml version="1.0"?>')) {
    function xor(str, key) {
        str = String(str).split('').map(letter => letter.charCodeAt());
        let res = "";
        for (i = 0; i < str.length; i++) res += String.fromCodePoint(str[i] ^ key);
        return res;
    }
    localLevels = xor(localLevels, 11)
    localLevels = Buffer.from(localLevels, 'base64')
    try { localLevels = zlib.unzipSync(localLevels).toString() }
    catch(e) { return console.log("Error! GD save file seems to be corrupt!") }
}

console.log("Parsing level data...")
let foundLevel = localLevels.match(levelRegex)
let foundData = foundLevel[2]
let levelData = foundData.startsWith('kS38') ? foundData : zlib.unzipSync(Buffer.from(foundData, 'base64')).toString()
levelData = levelData.replace(/kA14,.*?,/, "")  // clear old guidelined
let guidelines = ""

console.log("Adding guidelines...")
let config = fs.readFileSync('./settings.txt', 'utf8').split("\n").map(x => x.replace(/\s/g, "").split(":")[1])
let [BPM, songLength, offset, pattern] = config

pattern = pattern.toLowerCase().split("")
let beatsPerBar = pattern.length
let secondsPerBeat = Math.abs(60 / (+BPM || 100))

let beatCount = 0
let secs = (+offset || 0) / 1000

while (secs <= (+songLength || 150)) {
    let beat = pattern[beatCount % beatsPerBar]
    if (colors[beat]) guidelines += `${Number(secs.toFixed(5))}~${colors[beat]}~`
    beatCount++
    secs += secondsPerBeat
}

console.log("Saving level...")
let newData = levelData.replace(",kA6,", `,kA14,${guidelines.slice(0, -1)},kA6,`)
let newLevels = localLevels.replace(levelRegex, `$1${newData}</s>`)
fs.writeFileSync(gdLevels, newLevels, 'utf8')
console.log("Saved!")
