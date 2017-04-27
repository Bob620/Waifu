const fs = require('fs');
//const Garner = require('./garner.js');
const Discord = require('discord.js');
const Chata = require('chata-client');
const Random = require('random-js');
//const log = require('./util/log.js');
const kitsu = require('node-kitsu');
const FlakeId = require('flake-idgen');
const intformat = require('biguint-format')
const aws = require('aws-sdk');
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const dynamodb = new aws.DynamoDB({apiVersion: '2012-08-10', 'region': 'us-west-2'});
const UploadStream = require('s3-stream-upload');
const request = require('request');
const Server = require('./util/server.js');

const options = {
  "domains": `${__dirname}/domains`
}

class Bot {
  constructor({garner: {server: serverLogin = false}, discordToken: discordToken = false, chataToken = false}) {
    this.modules = {};

    if (discordToken) {
      this.modules["discord"] = new Server("discord", new Discord.Client({apiRequestMethod: "burst"}));
      this.modules.discord.connection.login(discordToken);
    }
    if (chataToken) {
      this.modules["chata"] = new Server("chata", new Chata());
      this.modules.chata.connection.login(chataToken);
    }

    if (Object.keys(this.modules).length > 0) {
      this.modules.random = new Random(Random.engines.mt19937().autoSeed());
      this.modules.kitsu = kitsu;
//      this.modules.log = log;
      this.modules.flakeId = new FlakeId();
      this.modules.intformat = intformat;
      this.modules.s3 = s3;
      this.modules.dynamodb = dynamodb;
      this.modules.uploadStream = UploadStream;
      this.modules.request = request;

      this.domains = [];
      this.createDomains();
      this.startDomains();

    } else {
      throw "A Bot Token required.";
    }
  }

  /**
   * Function used to create the underlying domains
   */
  createDomains() {
    // Search ./domains
    const files = fs.readdirSync(options.domains);
    files.forEach((file) => {
      const Domain = require(`${options.domains}/${file}/${file}.js`);

      this.domains.push(new Domain());
    });
  }

  /**
   * Function to begin/reset the underlying domains
   */
  startDomains() {
    this.domains.forEach((domain) => {
      let info = {"server": false, "requirements": {}};
      const domainRequirements = domain.requires();

      if (this.modules.hasOwnProperty(domainRequirements.serverType)) {
        info.server = this.modules[domainRequirements.serverType];
      } else {
        throw `Couldn't find the requested domain server ${domainRequirements.serverType}`;
      }

      const requirements = domainRequirements.requirements;
      for (let i = 0; i < requirements.length; i++) {
        const requireName = requirements[i];

        if (this.modules.hasOwnProperty(requireName)) {
          info.requirements[requireName] = this.modules[requireName];
        }
      }
      domain.start(info);
    });
  }
}

module.exports = Bot;
