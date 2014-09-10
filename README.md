mavis
=====
![mavis](https://s3.amazonaws.com/uploads.hipchat.com/31372/651154/yf873ynV6eAKs5D/mavis_vermillion_chapter_304_by_alicetweetyx2-d5ihitc.png)


Master Tactician, tells you which dock is optimal to build or start a container on.
-----------------------------------------------------------------------------------
She currently  looks at number of  containers/builds  currently on  a given  system
and  calculates  the best  dock  to  send the task to based on weights specified in
the  .env.* files. Docks  are  registered in redis  and each dock has its own  info
which  includes  numContainers  and  numBuilds  and  host  name.

Server Mode
-----------
use `npm start` to start this server on port specified env `HOST_POST` or env file.

Test
----
run `npm test`

API
===

POST /dock
----------
  inputs

  `body.type` = type of task that needs to be run.
  
    currently supports `container_build` and `container_run`

  *optional*

  `body.prevDock` = key of previous dock used by this container. used in calculations

  returns

  ```
  {
    dockHost: dockHost
  }
  ```

GET /docks
----------
  get list of active docks
  
  returns: array of active docks
  ```
  [{
    host: 'localhost',
    numContainer: 1
    numBuilds: 2
  }, ...]
  ```

POST /docks
----------
  update params of dock
  
  inputs (can also be query)
  
  `body.host` = host to update
  
  `body.value` = value to set
  
  `body.key` = key to update
  
    currently supports `container_build` and `container_run`


  returns: nothing 

DELETE /docks
----------
  removes dock from selection pool
  
  inputs (can also be query)
  
  `body.host` = host to delete

  returns: nothing 
  
PUT /docks
----------
  adds dock to selection pool
  
  inputs (can also be query)
  
  `body.host` = host to add

  returns: nothing 

GET /
-----
returns the name of the app 'runnable mavis: the fairy tactician'
