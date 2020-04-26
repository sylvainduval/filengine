# filengine

A NodeJS based filesystem indexation into MongoDB

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installing

Mongo and NodeJS must be installed.

Download or clone project on your local machine.
Just run :

```
npm install
```

Edit config.js and put your own settings:

```
{
	"apiPort": 3000,
	"apiSessionValidity": 3660,
	"db": "mongodb://localhost:27017/filengine",
	"directorySeparator": "/",
	"verbose": true,
	"threads": 2,
	"taskDelay": 2000,
	"watchers": 2000,
	"secretKey": "54AfdMO624dfpMq925Tjpl5Bu",
	"pathForNewLibraries": "/home/me/data"
}
```

| Parameter | Description |
| --- | --- |
| apiPort | Rest API listenning port |
| apiSessionValidity | in seconds, connexion will expire after inactivity |
| db | MongoDB connexion path | 
| directorySeparator | Depends on your system, like '/' or '\\' | 
| verbose | displays messages on console (true), or not (false) | 
| threads |  number of simultanous asynchronous tasks | 
| taskDelay | delay before watching for new task when none found |
| watchers | number of filesystem event watchers allowed for the app. Most recent directories will be watched | 
| secretKey | passphrase for encrypting users password in database | 
| pathForNewLibraries | New libraries will be created here | 

Then launch the app:

```
node app.js
```

## First login

Login with build-in first user api :
```
[POST] http://1.2.3.4:3000/login

x-www-form-urlencoded parameters :
Login: api
Password : api
```

JWT Token will return. You'll need to put this token in the header of next request :

### First library

A library is the first level of stored data. A user can access to one or many libraries.

```
[POST] http://1.2.3.4:3000/admin/library/add
```

Headers : 

| Parameter | Value |
| --- | --- |
| Content-Type | application/x-www-form-urlencoded |
| x-access-token | Your Session token |

Body :

| Parameter | Value |
| --- | --- |
| fullScanDelay | in minutes, delay between two full database and filesystem synchronisation |
| id | Main name of the library (brand, customer ID...). The main key in URL API calls |
| active | (true) to activate library usage and synchronisation |


### API documentation

Every method will short be explained. Coming soon...


## Authors

* **Sylvain DUVAL** - *Initial work* - [sylvainduval](https://github.com/sylvainduval)

See also the list of [contributors](https://github.com/sylvainduval/filengine/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
