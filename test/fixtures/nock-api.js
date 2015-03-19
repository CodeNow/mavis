'use strict';

require('../../lib/loadenv.js')();
var nock = require('nock');
nock.enableNetConnect();

var host = process.env.API_HOST;
var user = JSON.stringify({
  "_id": "example_id",
  "accounts": {
    "github" : {
      "username" : "HelloRunnable",
      "refreshToken" : null,
      "accessToken" : "example_token",
      "meta" : {
        "status" : "200 OK",
        "etag" : "\"f2e6affbdb0fc6ecf39a4572760fb160\"",
        "last-modified" : "Thu, 26 Feb 2015 21:57:19 GMT",
        "x-oauth-scopes" : "read:repo_hook, repo, user:email",
        "x-ratelimit-reset" : "1425946439",
        "x-ratelimit-remaining" : "4941",
        "x-ratelimit-limit" : "5000"
      },
      "updated_at" : "2015-02-26T21:57:19Z",
      "created_at" : "2014-12-17T18:47:56Z",
      "following" : 0,
      "followers" : 0,
      "public_gists" : 0,
      "public_repos" : 2,
      "site_admin" : false,
      "type" : "User",
      "received_events_url" : "https://api.github.com/users/HelloRunnable/received_events",
      "events_url" : "https://api.github.com/users/HelloRunnable/events{/privacy}",
      "repos_url" : "https://api.github.com/users/HelloRunnable/repos",
      "organizations_url" : "https://api.github.com/users/HelloRunnable/orgs",
      "subscriptions_url" : "https://api.github.com/users/HelloRunnable/subscriptions",
      "starred_url" : "https://api.github.com/users/HelloRunnable/starred{/owner}{/repo}",
      "gists_url" : "https://api.github.com/users/HelloRunnable/gists{/gist_id}",
      "following_url" : "https://api.github.com/users/HelloRunnable/following{/other_user}",
      "followers_url" : "https://api.github.com/users/HelloRunnable/followers",
      "html_url" : "https://github.com/HelloRunnable",
      "url" : "https://api.github.com/users/HelloRunnable",
      "gravatar_id" : "",
      "avatar_url" : "https://avatars.githubusercontent.com/u/10224339?v=3",
      "id" : 10224339,
      "login" : "HelloRunnable"
    }
  },
  "gravatar" : "https://gravatar.com/avatar/null",
  "permissionLevel" : 1,
  "email" : "github@runnable.com"
});

var instances = JSON.stringify([{"_id":"54e6609beb90841000aa6c08","name":"random_server","owner":{"gravatar":"https://avatars.githubusercontent.com/u/146592?v=3","username":"rsandor","github":146592},"lowerName":"random_server","contextVersion":{"_id":"54e664a0eb90841000aa8ab8","infraCodeVersion":"54e664a0eb90841000aa8ab9","createdBy":{"github":146592},"context":"54e6607aeb90841000aa6be5","__v":0,"dockerHost":"http://10.0.1.10:4242","containerId":"54e664a0eb90841000aa8ab7","build":{"started":"2015-02-19T22:33:15.287Z","triggeredBy":{"github":146592},"message":"Manual build","completed":"2015-02-19T22:34:04.672Z","duration":49385,"dockerTag":"registry.runnable.com/146592/54e6607aeb90841000aa6be5:54e664a0eb90841000aa8ab8","dockerImage":"d678139ac560","log":"\u001b[33m\u001b[1mDownloading build files...\u001b[22m\u001b[39m\nCloning rsandor/random-server into ./random-server\n\u001b[33m\u001b[1mBuilding box...\u001b[22m\u001b[39m\nSending build context to Docker daemon 48.13 kB\r\r\nSending build context to Docker daemon \r\nStep 0 : FROM node:0.10.35\n ---> 9787c55efe92\nStep 1 : EXPOSE 8000\n ---> Using cache\n ---> dbb41eb548ae\nStep 2 : ADD ./random-server /random-server\n ---> 72d272a20922\nRemoving intermediate container 9f03249bcc3f\nStep 3 : WORKDIR /random-server\n ---> Running in 1032265e5bd2\n ---> 1159d6912e28\nRemoving intermediate container 1032265e5bd2\nStep 4 : RUN apt-get update\n ---> Running in 105750e09dfd\nGet:1 http://security.debian.org jessie/updates InRelease [84.1 kB]\nGet:2 http://http.debian.net jessie InRelease [199 kB]\nGet:3 http://http.debian.net jessie-updates InRelease [117 kB]\nGet:4 http://security.debian.org jessie/updates/main amd64 Packages [20 B]\nGet:5 http://http.debian.net jessie/main amd64 Packages [9051 kB]\nGet:6 http://http.debian.net jessie-updates/main amd64 Packages [20 B]\nFetched 9451 kB in 13s (679 kB/s)\nReading package lists...\n\u001b[91mW: Size of file /var/lib/apt/lists/http.debian.net_debian_dists_jessie_main_binary-amd64_Packages.gz is not what the server reported 9050662 9065572\n\u001b[0m ---> ca32823ea582\nRemoving intermediate container 105750e09dfd\nStep 5 : CMD node random.js\n ---> Running in 61b492c8a7e1\n ---> d678139ac560\nRemoving intermediate container 61b492c8a7e1\nSuccessfully built d678139ac560\n\u001b[32m\u001b[1mBuild completed successfully!\u001b[22m\u001b[39m\n","triggeredAction":{"manual":true,"appCodeVersion":{"commitLog":[]}},"_id":"54e664a0eb90841000aa8ab7"},"appCodeVersions":[{"repo":"rsandor/random-server","lowerRepo":"rsandor/random-server","branch":"master","lowerBranch":"master","commit":"2709175fd6ec35be39dd730d0cfe5f539dbfa035","_id":"54e66099eb90841000aa6bf9","publicKey":"rsandor/random-server.key.pub","privateKey":"rsandor/random-server.key","id":"54e66099eb90841000aa6bf9"}],"created":"2015-02-19T22:33:04.305Z","id":"54e664a0eb90841000aa8ab8"},"shortHash":"2xrgy2","createdBy":{"gravatar":"https://avatars.githubusercontent.com/u/146592?v=3","username":"rsandor","github":146592},"build":{"_id":"54e664a0eb90841000aa8aba","createdBy":{"github":146592},"owner":{"github":146592},"__v":0,"buildNumber":9653,"started":"2015-02-19T22:33:15.208Z","completed":"2015-02-19T22:34:04.688Z","duration":49480,"failed":false,"created":"2015-02-19T22:33:04.314Z","erroredContextVersions":[],"contextVersions":["54e664a0eb90841000aa8ab8"],"contexts":["54e6607aeb90841000aa6be5"],"successful":true,"id":"54e664a0eb90841000aa8aba"},"__v":0,"container":{"ports":{"8000/tcp":[{"HostPort":"52666","HostIp":"0.0.0.0"}]},"inspect":{"AppArmorProfile":"","Args":["-c","node random.js"],"Config":{"AttachStderr":false,"AttachStdin":false,"AttachStdout":false,"Cmd":["/bin/sh","-c","node random.js"],"CpuShares":0,"Cpuset":"","Domainname":"","Entrypoint":null,"Env":["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","NODE_VERSION=0.10.35","NPM_VERSION=2.2.0"],"Hostname":"d43eba8dca13","Image":"registry.runnable.com/146592/54e6607aeb90841000aa6be5:54e664a0eb90841000aa8ab8","MacAddress":"","Memory":0,"MemorySwap":0,"NetworkDisabled":false,"OnBuild":null,"OpenStdin":false,"PortSpecs":null,"StdinOnce":false,"Tty":false,"User":"","Volumes":null,"WorkingDir":"/random-server"},"Created":"2015-02-19T22:30:57.482025989Z","Driver":"aufs","ExecDriver":"native-0.2","HostConfig":{"Binds":null,"CapAdd":null,"CapDrop":null,"ContainerIDFile":"","Devices":null,"Dns":["205.251.195.203","8.8.8.8"],"DnsSearch":null,"ExtraHosts":null,"IpcMode":"","Links":null,"LxcConf":null,"NetworkMode":"","PortBindings":null,"Privileged":false,"PublishAllPorts":true,"RestartPolicy":{"MaximumRetryCount":0,"Name":""},"SecurityOpt":null,"VolumesFrom":null},"HostnamePath":"/docker/containers/d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2/hostname","HostsPath":"/docker/containers/d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2/hosts","Id":"d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2","Image":"d678139ac560f48e3277d47cf70c6f96f0df79d1515257d1a8ea47b5fcada4dc","MountLabel":"","Name":"/silly_fermat","NetworkSettings":{"Bridge":"","Gateway":"","IPAddress":"","IPPrefixLen":0,"MacAddress":"","PortMapping":null,"Ports":null},"Path":"/bin/sh","ProcessLabel":"","ResolvConfPath":"/docker/containers/d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2/resolv.conf","State":{"Error":"","ExitCode":-1,"FinishedAt":"2015-03-05T23:55:58.149633152Z","OOMKilled":false,"Paused":false,"Pid":0,"Restarting":false,"Running":false,"StartedAt":"2015-02-19T22:31:00.675823727Z"}},"dockerContainer":"d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2","dockerHost":"http://10.0.1.10:4242"},"network":{"networkIp":"10.254.176.0","hostIp":"10.254.176.1"},"env":[],"created":"2015-02-19T22:15:55.070Z","locked":false,"public":false,"contextVersions":[{"_id":"54e664a0eb90841000aa8ab8","infraCodeVersion":"54e664a0eb90841000aa8ab9","createdBy":{"github":146592},"context":"54e6607aeb90841000aa6be5","__v":0,"dockerHost":"http://10.0.1.10:4242","containerId":"54e664a0eb90841000aa8ab7","build":{"started":"2015-02-19T22:33:15.287Z","triggeredBy":{"github":146592},"message":"Manual build","completed":"2015-02-19T22:34:04.672Z","duration":49385,"dockerTag":"registry.runnable.com/146592/54e6607aeb90841000aa6be5:54e664a0eb90841000aa8ab8","dockerImage":"d678139ac560","log":"\u001b[33m\u001b[1mDownloading build files...\u001b[22m\u001b[39m\nCloning rsandor/random-server into ./random-server\n\u001b[33m\u001b[1mBuilding box...\u001b[22m\u001b[39m\nSending build context to Docker daemon 48.13 kB\r\r\nSending build context to Docker daemon \r\nStep 0 : FROM node:0.10.35\n ---> 9787c55efe92\nStep 1 : EXPOSE 8000\n ---> Using cache\n ---> dbb41eb548ae\nStep 2 : ADD ./random-server /random-server\n ---> 72d272a20922\nRemoving intermediate container 9f03249bcc3f\nStep 3 : WORKDIR /random-server\n ---> Running in 1032265e5bd2\n ---> 1159d6912e28\nRemoving intermediate container 1032265e5bd2\nStep 4 : RUN apt-get update\n ---> Running in 105750e09dfd\nGet:1 http://security.debian.org jessie/updates InRelease [84.1 kB]\nGet:2 http://http.debian.net jessie InRelease [199 kB]\nGet:3 http://http.debian.net jessie-updates InRelease [117 kB]\nGet:4 http://security.debian.org jessie/updates/main amd64 Packages [20 B]\nGet:5 http://http.debian.net jessie/main amd64 Packages [9051 kB]\nGet:6 http://http.debian.net jessie-updates/main amd64 Packages [20 B]\nFetched 9451 kB in 13s (679 kB/s)\nReading package lists...\n\u001b[91mW: Size of file /var/lib/apt/lists/http.debian.net_debian_dists_jessie_main_binary-amd64_Packages.gz is not what the server reported 9050662 9065572\n\u001b[0m ---> ca32823ea582\nRemoving intermediate container 105750e09dfd\nStep 5 : CMD node random.js\n ---> Running in 61b492c8a7e1\n ---> d678139ac560\nRemoving intermediate container 61b492c8a7e1\nSuccessfully built d678139ac560\n\u001b[32m\u001b[1mBuild completed successfully!\u001b[22m\u001b[39m\n","triggeredAction":{"manual":true,"appCodeVersion":{"commitLog":[]}},"_id":"54e664a0eb90841000aa8ab7"},"appCodeVersions":[{"repo":"rsandor/random-server","lowerRepo":"rsandor/random-server","branch":"master","lowerBranch":"master","commit":"2709175fd6ec35be39dd730d0cfe5f539dbfa035","_id":"54e66099eb90841000aa6bf9","publicKey":"rsandor/random-server.key.pub","privateKey":"rsandor/random-server.key","id":"54e66099eb90841000aa6bf9"}],"created":"2015-02-19T22:33:04.305Z","id":"54e664a0eb90841000aa8ab8"}],"containers":[{"ports":{"8000/tcp":[{"HostPort":"52666","HostIp":"0.0.0.0"}]},"inspect":{"AppArmorProfile":"","Args":["-c","node random.js"],"Config":{"AttachStderr":false,"AttachStdin":false,"AttachStdout":false,"Cmd":["/bin/sh","-c","node random.js"],"CpuShares":0,"Cpuset":"","Domainname":"","Entrypoint":null,"Env":["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","NODE_VERSION=0.10.35","NPM_VERSION=2.2.0"],"Hostname":"d43eba8dca13","Image":"registry.runnable.com/146592/54e6607aeb90841000aa6be5:54e664a0eb90841000aa8ab8","MacAddress":"","Memory":0,"MemorySwap":0,"NetworkDisabled":false,"OnBuild":null,"OpenStdin":false,"PortSpecs":null,"StdinOnce":false,"Tty":false,"User":"","Volumes":null,"WorkingDir":"/random-server"},"Created":"2015-02-19T22:30:57.482025989Z","Driver":"aufs","ExecDriver":"native-0.2","HostConfig":{"Binds":null,"CapAdd":null,"CapDrop":null,"ContainerIDFile":"","Devices":null,"Dns":["205.251.195.203","8.8.8.8"],"DnsSearch":null,"ExtraHosts":null,"IpcMode":"","Links":null,"LxcConf":null,"NetworkMode":"","PortBindings":null,"Privileged":false,"PublishAllPorts":true,"RestartPolicy":{"MaximumRetryCount":0,"Name":""},"SecurityOpt":null,"VolumesFrom":null},"HostnamePath":"/docker/containers/d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2/hostname","HostsPath":"/docker/containers/d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2/hosts","Id":"d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2","Image":"d678139ac560f48e3277d47cf70c6f96f0df79d1515257d1a8ea47b5fcada4dc","MountLabel":"","Name":"/silly_fermat","NetworkSettings":{"Bridge":"","Gateway":"","IPAddress":"","IPPrefixLen":0,"MacAddress":"","PortMapping":null,"Ports":null},"Path":"/bin/sh","ProcessLabel":"","ResolvConfPath":"/docker/containers/d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2/resolv.conf","State":{"Error":"","ExitCode":-1,"FinishedAt":"2015-03-05T23:55:58.149633152Z","OOMKilled":false,"Paused":false,"Pid":0,"Restarting":false,"Running":false,"StartedAt":"2015-02-19T22:31:00.675823727Z"}},"dockerContainer":"d43eba8dca139a13d38326846bf9a0bb3589953a647b7e6f4d5bdf67fa084ac2","dockerHost":"http://10.0.1.10:4242"}],"id":"54e6609beb90841000aa6c08","dependencies":{}}]);

function intercept(cb) {
  var scope = nock(host).persist();
  scope.post('/auth/github/token').reply(200, 'example_token');
  scope.get('/users/me').reply(200, user)
  scope.intercept('/auth', 'DELETE').reply(200);

  // http://api.runnable.io:3000/instances?owner[github]=10224339&container.dockerContainer=1

  // var instancesRegex = /\/instances\?owner[github]=\d+&container.dockerContainer=(\d+)/;
  // var instancesReplace = '/instances?container.dockerContainer=$1';

  // scope.filteringPath(instancesRegex, instancesReplace)
  //   .get('/instances')

  scope
    .get('/instances?owner[github]=10224339&container.dockerContainer=1')
      .reply(200, instances)
    .get('/instances?owner[github]=10224339&container.dockerContainer=2')
      .reply(200, instances);


  // scope.get('/instances').reply(200, function(uri) {
  //   console.log("\n\n\n\nURI:", uri);
  //   return instances;
  // });
  if (cb) { cb(); }
}

function clean(cb) {
  nock.cleanAll();
  if (cb) { cb(); }
}

module.exports = {
  nock: intercept,
  clean: clean
}
