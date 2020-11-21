'use strict';

const { App, HttpService } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');
const requestPromise = require('request-promise-native');

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const app = new App();

app.use(
  new Alexa(),
  new GoogleAssistant(),
  new JovoDebugger(),
  new FileDb()
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

const REQUEST_PATH = 'https://moaci-backend.herokuapp.com';

app.setHandler({
  async LAUNCH() {
     /*
    Checks if there is an access token. 
    No access token -> Ask the user to sign in
    If there is one -> API call to access user data 
    */
    console.log('Meu Log----->');

   if (!this.$request.getAccessToken()) {
      this.$alexaSkill.showAccountLinkingCard();
      console.log('MY LOG --> Não tem access token')
      this.tell('Por favor, realize o login');
    } else {
      const token = this.$request.getAccessToken();
        // API request
        const { data } = await HttpService.get('https://dev-qd-kqcj9.us.auth0.com/userinfo', {
            headers: {
                authorization: 'Bearer ' + token,
            },
        });
        console.log('My log starts-----')
        console.log(data);
        console.log(token);
        console.log('My log finish-----')
        this.$session.$data.nickname = data.nickname;
        this.$session.$data.userid = 'user_b8c40def-b62d-4e8a-965a-43544f31b25c';

        //return this.toIntent('HelloWorldIntent');
        //this.tell(`${data.nickname}, ${data.email}`);
        this.ask('Olá, bem-vindo ao seu Consumo de Energia. Em que posso ajudar?', 'Você pode perguntar sobre o seu consumo corrente, por exemplo');
    }
  },

  HelloWorldIntent() {
    
    console.log('My log with data nickname-----')
    console.log(this.$session.$data.nickname);
    //this.ask("Hello World! What's your name?", 'Please tell me your name.');
    this.ask(this.t('HELLO_WORLD_WHATS_YOUR_NAME'), this.t('PLEASE_TELL_YOUR_NAME'));
  },

  async CurrentConsumptionIntent() {
    console.log('Entrou na intent CurrentConsumptionIntent --------');
    var userId = this.$session.$data.userid;
    console.log('user id' + userId);
    var currentConsumption = await getCurrentConsumption(userId);
    console.log('Request response '+currentConsumption);
    if (currentConsumption == null || currentConsumption == 0 || currentConsumption == '') {
      this.tell('Ainda não foi possível coletar informações do seu consumo de energia. Tente me perguntar de novo daqui a uma hora');  
    } else {
      this.tell('O seu consumo atual desse mês é de ' + currentConsumption + ' watts de energia');
    }
  },

  async CurrentConsumptionValueIntent() {
    console.log('Entrou na intent CurrentConsumptionIntent --------');
    var userId = this.$session.$data.userid;
    console.log('user id' + userId);
    var currentConsumption = await getCurrentConsumptionInValue(userId);
    console.log('Request response '+currentConsumption);
    if (currentConsumption == null || currentConsumption == 0 || currentConsumption == '') {
      this.tell('Ainda não foi possível coletar informações do seu consumo de energia. Tente me perguntar de novo daqui a uma hora');  
    } else {
      this.tell('Segundo meus cálculos, você já gastou aproximadamente' + currentConsumption + ' reais de energia esse mês');
    }
  },

  async CurrentDevicesOnIntent() {
    this.$session.$data.devices = null;
    console.log('Entrou na intent CurrentDevicesOnIntent');
    let reprompt = 'Gostaria de saber quais outros aparelhos que estão ligados?';
  
    var userId = this.$session.$data.userid;

    var response = await getDevicesTurnOn(userId);

    console.log('mock data');
    console.log(response);

    if (response == null || response.devices.length == 0) {
        this.tell('Não foi possível encontrar aparelhos ligados no momento');

    } else {
      if (response.devices.length > 5) {
        let devices = getDevicesByPosition(response.devices, 0, 5);
        this.$session.$data.devices = response.devices;
        this.$session.$data.position = 5;

        this.followUpState('CurrentDevicesOnState')
        .ask('Estão ligado no momento '+devices + ' .Gostaria de ouvir mais?', reprompt);
      } else {
        let devices = getDevicesByPosition(response.devices, 0, response.devices.length);
          this.tell('Estão ligado no momento '+devices + '.');
      }
    }
  },

  CurrentDevicesOnState: {
    YesIntent() {
        var currentPos = this.$session.$data.position;
        var devices = this.$session.$data.devices;
        var endPos = currentPos + 5;

        if (endPos >= devices.length) {
          endPos = devices.length;
          let response = getDevicesByPosition(devices, currentPos, endPos);
          
          this.tell('Por fim, os últimos aparelhos ligados são '+response);
          
          this.$session.$data.devices = null;
          this.$session.$data.position = 0;

        } else {
          let response = getDevicesByPosition(devices, currentPos, endPos);
          this.$session.$data.position = endPos;
          
          this.followUpState('CurrentDevicesOnState')
              .ask('Também estão ligados '+response + ' .Gostaria de ouvir mais?', 'Gostaria de saber quais outros aparelhos estão ligados?');
        }
    },
    NoIntent() {
        this.$session.$data.devices = null;
        this.$session.$data.position = 0;
        this.tell('Tudo bem, até logo');
    },
    Unhandled() {
      this.followUpState('CurrentDevicesOnState')
                .ask('Você deve dizer sim ou não.', 'Por favor, diga sim ou não');
    }
  },
  async LastMonthSpentIntent() {
    var userId = this.$session.$data.userid;

    var response = await getHowMuchSpentLastMonth(userId);
    let value = '9';
    this.tell('Mês passado você gastou aproximadamente '+ value + ' reais de energia elétrica');
  },
  async NextMonthSpend() {
    var userId = this.$session.$data.userid;

    var response = await getHowMuchSpendNextMonth(userId);
    let value = '9';
    this.tell('Segundo meus cálculos, você irá gastar aproximadamente '+ value + ' reais de energia elétrica');
  },
  async TipsIntent() {
    var userId = this.$session.$data.userid;

    var response = await getTipsForEnergyComsumption(userId);
    if (response != null && response != '') {
      this.tell(response);
    } else {
      this.ask('Houve um problema para carregar sua dica. Pode tentar novamente?', 'Pode perguntar novamente?');
    }
  }

  // Unhandled() {
  //   return this.toIntent('LAUNCH');
  // }

});

function getDevicesByPosition(devices, startPos, endPos) {
    var response = '';
    if (startPos >= 0 && startPos < endPos) {
      for (var pos = startPos; pos < endPos; pos++) {
        if (pos == startPos) {
          response = devices[pos].device;  
        } else if (pos == endPos - 1) {
          response += ' e ' + devices[pos].device;  
        } else {
          response += ', ' + devices[pos].device;
        }
      }
    }

    console.log('response '+ response);

    return response;
}

async function getCurrentConsumption(userId) {
  console.log('Current path ' + REQUEST_PATH);
  console.log('user id for request ' + userId);
  console.log(REQUEST_PATH + '/alexa/'+userId+'/consumption/now')
  const options = {
    uri: REQUEST_PATH + '/alexa/'+userId+'/consumption/now',
    json: true
  };
  const data = await requestPromise(options);

  return data.home_consumption;
}

async function getCurrentConsumptionInValue(userId) {
  console.log('Current path ' + REQUEST_PATH);
  console.log('user id for request ' + userId);
  console.log(REQUEST_PATH + '/alexa/'+userId+'/consumption/now')

  /**TODO implement the right request*/

  const options = {
    uri: REQUEST_PATH + '/alexa/'+userId+'/consumption/now',
    json: true
  };
  const data = await requestPromise(options);

  return data.home_consumption;
}

async function getDevicesTurnOn(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/' + userId + '/home_appliance/now',
    json: true
  };
  const data = await requestPromise(options);

  var mockData = {"devices":[ { "device": "geladeira"},
                              { "device": "tv"},
                              { "device": "computador"},
                              { "device": "máquina de lavar"},
                              { "device": "tv"},
                              { "device": "refrigerador"},
                              { "device": "abajur"},
                              { "device": "escova elétrica"},
                              { "device": "abajur 2"},
                              { "device": "barbeador"},
                              { "device": "modem de internet"},
                              { "device": "vídeo game"},
                              { "device": "tv 3"},
                              { "device": "máquina"}
                            ]};

  return mockData;
}

async function getDeviceMaxConsumption(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/'+ userId + '/home_appliance/max_consumption',
    json: true
  };
  const data = await requestPromise(options);

  return data.home_appliance;
}

async function getHowMuchSpentLastMonth(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/'+ userId + '/home_appliance/max_consumption',
    json: true
  };
  const data = await requestPromise(options);

  return data.home_appliance;
}

async function getHowMuchSpendNextMonth(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/'+ userId + '/home_appliance/max_consumption',
    json: true
  };
  const data = await requestPromise(options);

  return data.home_appliance;
}

async function getTipsForEnergyComsumption(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/'+ userId + '/home_appliance/max_consumption',
    json: true
  };
  const data = await requestPromise(options);

  var mockValue = 'Você pode desligar sua máquina de lavar da tomada quando não estiver utilizando';
  return mockValue;
  //return data.home_appliance;
}

module.exports = { app };
