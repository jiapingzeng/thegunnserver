var config = require('config')
var express = require('express')
var fs = require('fs')
var moment = require('moment')
var path = require('path')
var request = require('request')
var router = express.Router()

var serverUrl = (process.env.GOOGLE_CALENDAR_SERVER_URL) ? (process.env.GOOGLE_CALENDAR_SERVER_URL) : config.get('serverUrl')
var calendarId = (process.env.GOOGLE_CALENDAR_ID) ? (process.env.GOOGLE_CALENDAR_ID) : config.get('calendarId')
var apiKey = (process.env.GOOGLE_API_KEY) ? (process.env.GOOGLE_API_KEY) : config.get('apiKey')

router.get('/', (req, res, next) => {
    res.render('thegunnapp', { title: 'TheGunnApp' })
})

router.get('/index', (req, res, next) => {
    res.redirect('/')
})

router.get('/get', (req, res, next) => {
    getSchedule(function (calendar) {
        res.render('thegunnapp', { data: calendar })
    }, function() {
        console.log('crap something happened')
        res.sendStatus(500)
    })
})

router.post('/post', (req, res, next) => {
    getSchedule(function (calendar) {
        res.send(calendar)
    }, function () {
        console.log('done with yo shit')
        res.sendStatus(500)
    })
})

/*
router.get('/post', (req, res, next) => {
    getCalendar(function() {
        console.log('sending file')
        res.sendFile(path.resolve('public/data/thegunnapp.json'))
    }, function() {
        console.log('error')
    })    
})
*/

function copy(o) {
   var output, v, key;
   output = Array.isArray(o) ? [] : {};
   for (key in o) {
       v = o[key];
       output[key] = (typeof v === "object") ? copy(v) : v;
   }
   return output;
}

function getCalendar(cb, err) {
    request({
        uri: serverUrl.replace('calendarId', calendarId),
        qs: {
            key: apiKey,
            singleEvents: true,
            orderBy: "startTime",
            timeMin: moment().format()
        },
        method: 'GET'
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log('successfully retrived calendar')
            cb(body)
            //fs.writeFile(__dirname + '/../public/data/thegunnapp.json', body.trim(), cb(error, response, body))
        } else {
            console.log('retriving calendar failed')
            err()
        }
    })
}

function getSchedule(cb, err) {
    getCalendar(function (body) {
        var data = JSON.parse(body.trim())
        var calendar = copy(data)
        calendar.items = []
        for (var i = 0; i < data.items.length; i++) {
            var event = data.items[i]
            if (event.summary && event.summary.toLowerCase().includes('schedule')) {
                calendar.items.push(event)
            }
        }
        cb(calendar)
    }, err)
}

module.exports = router
