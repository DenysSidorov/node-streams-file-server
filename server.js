/**
 ЗАДАЧА - научиться работать с потоками (streams)
 Написать HTTP-сервер для загрузки и получения файлов
 - Все файлы находятся в директории files
 - Структура файлов НЕ вложенная.

 - Виды запросов к серверу
 GET /file.ext
 - выдаёт файл file.ext из директории files,

 POST /file.ext
 - пишет всё тело запроса в файл files/file.ext и выдаёт ОК
 - если файл уже есть, то выдаёт ошибку 409
 - при превышении файлом размера 1MB выдаёт ошибку 413

 DELETE /file
 - удаляет файл
 - выводит 200 OK
 - если файла нет, то ошибка 404

 Вместо file может быть любое имя файла.
 Так как поддиректорий нет, то при наличии / или .. в пути сервер должен выдавать ошибку 400.

 - Сервер должен корректно обрабатывать ошибки "файл не найден" и другие (ошибка чтения файла)
 - index.html или curl для тестирования

 */

// Пример простого сервера в качестве основы

'use strict';

var url = require('url');
var util = require('util');
var fs = require('fs');
var Readable = require('stream').Readable;
var Writeable = require('stream').Writeable;
// const mime = require('mime');

var http = require('http');
var server = http.createServer(app);
server.listen(8050, function () {
  console.log('Server started');
});
server.on('error', function () {
  console.log('Global Server Error');
})
module.exports = server;

function app(req, res) {
  let pathname = decodeURI(url.parse(req.url).pathname);
  switch (req.method) {
    case 'GET':
      if (pathname == '/favicon.ico') {
        res.statusCode = 404;
        res.end("Not exists");
      } else if (pathname == '/') {
        sendFile(pathname, res, true)
        // отдачу файлов следует переделать "правильно", через потоки, с нормальной обработкой ошибок
        // fs.readFile(__dirname + '/public/index.html', (err, content) => {
        //   if (err) throw err;
        //   res.setHeader('Content-Type', 'text/html;charset=utf-8');
        //   res.end(content);
        // });
        // return;
        break;
      }
      else if (true/* pathname == '/' */) {
        // todo get
        var path = pathname.slice(1, pathname.length);
        sendFile(path, res)
      }
      break;
    case 'POST':
      recieveFile(pathname, req, res);
      break;
    case 'DELETE':
      deleteFile(pathname, req, res);
      break;
    default:
      res.statusCode = 502;
      res.end("Not implemented");
  }
}

function recieveFile(pathname, req, res) {
  var maxSize = 10e6;
  var size = 0;
  var writeStream = new fs.WriteStream(__dirname + '/public/img' + pathname, {flags: 'wx'});
  writeStream
    .on('error', err => {
      if (err.code === 'EEXIST') {
        res.statusCode = 409;
        res.end('File exists');
      } else {
        console.error(err);
        if (!res.headersSent) {
          res.writeHead(500, {'Connection': 'close'});
          res.write('Internal error');
        }
        fs.unlink(pathname, err => { // eslint-disable-line
          /* ignore error */
          res.end();
        });
      }

    })
    .on('close', function () {
      res.end('OK');
    })
  req.on('data', function (chunk) {
    size = size + chunk.length;
    console.log(size);
    if (size > maxSize) {
      console.log('too big!');
      res.statusCode = 413;
      res.setHeader('Connection', 'close');
      res.end('File is too big!');
      writeStream.destroy();
      fs.unlink(pathname, err => {
        console.log(err);
      });
    }
  })
    .on('close', function () {
      writeStream.destroy();
      fs.unlink(pathname, err => {
        console.log(err);
      });
    })
    .on('finish', function () {
    })
    .pipe(writeStream);
  res.on('finish', () => console.log('finish'));
}

function sendFile(filepath, res, isIndex) {
  var path;
  if (isIndex) {
    path = '/public/index.html'
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
  } else {
    res.setHeader('Content-Type', 'image/jpeg');
    path = '/public/img/' + filepath
  }
  var rStream = fs.createReadStream(__dirname + path);
  rStream.pipe(res);

  rStream.on('open', function () {
    // res.setHeader('Content-Type', 'image/jpg'/*mime.lookup(filepath)*/);
  })
  rStream.on('error', function (er) {
    if (er.code == 'ENOENT') {
      console.log('Not found file');
      res.statusCode = 404;
      res.end('Not found');
    } else {
      console.log(er);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end('Server has problem');
      }
      res.end();
    }
  })

  res.on('close', function () {
    rStream.destroy();
  })
}

function deleteFile(filepath, req, res) {
  var path = __dirname + '/public/img/' + filepath;
  fs.unlink(path, err => {
    if (err) {
      console.log(err);
      res.statusCode = 404;
      res.end('File not exist')
    } else {
      res.statusCode = 200;
      res.end('Ok')
    }
  });
}
