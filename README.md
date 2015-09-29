# test-task-jwt

Here are two kinds of implementation of jwt socket authorization.
First one (custom) satisfies to the task description at all. <br/>
To run application in this mode, just run
``` node app.js ```

Second one, using `socket-jwt` module, more 'right', but in this case server actually do not respond data on success, 
it only emits event `connect` or `error`. This one I've implemented first and decided that it's not enough.
<br/>
To run application in this mode: <br/>
1)  
  ```javascript
  export SOCKET_AUTH_TYPE=socketjwt
  node app.js 
  ```
2) in `/public/js/app.js`, uncomment two listeners. <br/>

That's it.



