# filengine

A NodeJS based filesystem indexation into MongoDB

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installing

Mongo and NodeJS must be installed.

Download or clone project on your local machine.
Just run :

```npm install
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
| directorySeparator | Depends on your system, like '/' or '\' | 
| verbose | displays messages on console (true), or not (false) | 
| threads |  number of simultanous asynchronous tasks | 
| taskDelay | delay before watching for new task when none found |
| watchers | number of filesystem event watchers allowed for the app | 
| secretKey | passphrase for encrypting users password in database | 
| pathForNewLibraries | New libraries will be created here | 

Then launch the app:

```node app.js
```

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc

