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
var fs = require('fs');
var Readable = require('stream').Readable;
var Writeable = require('stream').Writeable;
// const mime = require('mime');

var http = require('http');
var server = http.createServer(app);
server.listen(8050, function () {
  console.log('Server started');
});
server.on('error', function() {
  console.log('Global Server Error');
})

function app(req, res) {
  let pathname = decodeURI(url.parse(req.url).pathname);
  switch (req.method) {
    case 'GET':
      if (pathname == '/favicon.ico') {
        res.statusCode = 404;
        res.end("Not exists");
      } else if (pathname == '/') {
        // отдачу файлов следует переделать "правильно", через потоки, с нормальной обработкой ошибок
        fs.readFile(__dirname + '/public/index.html', (err, content) => {
          if (err) throw err;
          res.setHeader('Content-Type', 'text/html;charset=utf-8');
          res.end(content);
        });
        return;
      }
      else if (true/* pathname == '/' */) {
        // todo get
        var path = pathname.slice(1, pathname.length);
        sendFile(path, res)
      } break;

    default:
      res.statusCode = 502;
      res.end("Not implemented");
  }
}

function sendFile(filepath, res) {
  console.log(filepath, 'URL');
  var rStream = fs.createReadStream(__dirname + '/public/img/' + filepath);
  rStream.pipe(res);

  rStream.on('open',function () {
    // res.setHeader('Content-Type', 'image/jpg'/*mime.lookup(filepath)*/);
  })
  rStream.on('error', function (er) {
    if (er.code == 'ENOENT') {
      console.log('Not found file');
      res.statusCode = 404;
      res.end('Not found');
    } else {
      console.log(er);
      if(!res.headersSent){
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
