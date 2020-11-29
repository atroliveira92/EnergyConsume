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

const {getTipsForEnergyComsumption, getNextMonthConsumption} = require('./requests');

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
        console.log(data['https://consumoenergia.com.br/metadata']);
        let metadata = data['https://consumoenergia.com.br/metadata'];
        console.log(metadata.user_id);
        console.log('My log finish-----')
        this.$session.$data.userid = metadata.user_id;

        console.log(getTipsForEnergyComsumption);

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
    var response = await getCurrentConsumption(userId);
    console.log('Request response '+response);
    if (response == null) {
      this.tell('Ainda não foi possível coletar informações do seu consumo de energia. Tente me perguntar de novo daqui a uma hora');  
    } else if (response.hasOwnProperty('message')) {
        this.tell(response['message']);
    } else {
      let consumption = response.consuption;
      this.tell('O seu consumo atual desse mês é de ' + consumption + ' watts de energia');
    }
  },

  async CurrentConsumptionValueIntent() {
    console.log('Entrou na intent CurrentConsumptionIntent --------');
    var userId = this.$session.$data.userid;
    console.log('user id' + userId);

    try {
      const userTimeZone = await this.$alexaSkill.$user.getTimezone();
      console.log('time zone '+userTimeZone);

      const currentDateTime = new Date(new Date().toLocaleString("en-US", {timeZone: userTimeZone}));
      
      console.log(currentDateTime);


      let response = await getConsumptionByDate(userId, currentDateTime.getFullYear(), currentDateTime.getMonth() + 1);
      if (response.hasOwnProperty('message')) {
        this.tell(response.message);
      } else if (response == null || !response.hasOwnProperty('price')) {
        this.ask('Desculpe, não foi possível carregar informações de seu consumo esse mês. Pode tentar novamente ou me fazer outra pergunta?', 'Pode me perguntar novamente');
      } else {
        this.tell('Segundo meus cálculos, você já gastou aproximadamente ' + getPriceVoiceResponse(response.price) + ' de energia elétrica esse mês');
      }

    } catch(error) {
        console.log(error);
        this.ask('Desculpe, ocorreu um erro ao carregar informações sobre data e hora. Pode perguntar novamente ou me perguntar algo mais?', 'Pode perguntar novamente?');
    }
  },

  async CurrentDevicesOnIntent() {
    this.$session.$data.devices = null;
    console.log('Entrou na intent CurrentDevicesOnIntent');
    let reprompt = 'Gostaria de saber quais outros aparelhos que estão ligados?';
  
    var userId = this.$session.$data.userid;

    var response = await getDevicesTurnOn(userId);

    console.log('response');
    console.log(response);

    if (response == null) {
        this.tell('Não foi possível encontrar aparelhos ligados no momento');

    } else if (response.hasOwnProperty('message')) {
        this.tell(response['message']);
    } else {
      let devicesResponse = response.home_appliances;
      if (devicesResponse.length > 5) {
        let devices = getDevicesByPosition(devicesResponse, 0, 5);
        this.$session.$data.devices = devicesResponse;
        this.$session.$data.position = 5;

        this.followUpState('CurrentDevicesOnState')
        .ask('Estão ligado no momento '+devices + ' .Gostaria de ouvir mais?', reprompt);
      } else {
        let devices = getDevicesByPosition(devicesResponse, 0, devicesResponse.length);
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
    
    try {
      const userTimeZone = await this.$alexaSkill.$user.getTimezone();
      console.log('time zone '+userTimeZone);

      const currentDateTime = new Date(new Date().toLocaleString("en-US", {timeZone: userTimeZone}));
      
      console.log(currentDateTime);
      
      var year = currentDateTime.getFullYear();
      var month = currentDateTime.getMonth();

      if (month == 0) {
          year = year - 1;
          month = 12;
      }

      let response = await getConsumptionByDate(userId, year, month);
      if (response != null && response.hasOwnProperty('price')) {
        
        this.tell('Você gastou aproximadamente ' + getPriceVoiceResponse(response.price) + ' de energia elétrica mês passado');
      }
  
    } catch(error) {
        console.log(error);
        this.ask('Desculpe, ocorreu um erro ao carregar informações sobre data e hora. Pode perguntar novamente ou me perguntar algo mais?', 'Pode perguntar novamente?');
   }

    // var response = await getHowMuchSpentLastMonth(userId);
    // let value = '9';
    // this.tell('Mês passado você gastou aproximadamente '+ value + ' reais de energia elétrica');
  },

  async NextMonthSpend() {
    var userId = this.$session.$data.userid;
    let errorMessage = 'Não foi possível carregar a previsão de consumo do próximo mês. Gostaria de perguntar novamente?';
    let reprompt = 'Gostaria de tentar perguntar novamente?';
    var response = await getNextMonthConsumption(userId);
    if (response == null) {
      this.ask(errorMessage, reprompt);
    } else if (response.hasOwnProperty('message')) {
      this.tell(response['message']);
    } else {
      let value = response.price;
      if (value == null || value == 0) {
        this.ask(errorMessage, reprompt);
      } else {
        this.tell('Segundo meus cálculos, você irá gastar aproximadamente '+ getPriceVoiceResponse(value) + ' de energia elétrica');
      }
    }
  },

  async TipsIntent() {
    var userId = this.$session.$data.userid;

    var response = await getTipsForEnergyComsumption(userId);
    if (response != null && response != '') {
      this.tell(response.title + '. ' + response.detail);
    } else {
      this.ask('Houve um problema para carregar sua dica. Pode tentar novamente?', 'Pode tentar novamente?');
    }
  },

  async DevicesConsumptionIntent() {
    var userId = this.$session.$data.userid;

    var response = await getDeviceMaxConsumption(userId);

    if (response == null) {
      this.tell('Não foi possível encontrar aparelhos ligados no momento');

    } if (response.hasOwnProperty('message')) {
      this.tell(response['message']);
    } else {
      var endPos = 5;
      if (response.home_appliances.length < 5) {
        endPos = response.home_appliances.length;
      }

      let devices = getDevicesByPosition(response.home_appliances, 0, endPos);
      
      this.tell('Os aparelhos que mais gastam energia elétrica são ' + devices + '.');
      
    }
  },

  Unhandled() {
    this.ask('Não consegui compreender o que perguntou. Pode tentar novamente?', 'Pode repetir a pergunta?');
  },
  NoIntent() {
    this.tell('Tudo bem, até logo');
  }

});

function getPriceVoiceResponse(price) {
  if (price == null || price == '') {
    return 0 + ' reais';
  }
  if (price.includes(',')) {
    let split = price.split(',');
    if (split[1] == '0' || split[1] == '00') {
      return split[0] + ' reais';
    }
    return split[0] + ' reais e ' + split[1] + ' centavos';
  }

  return price + ' reais';

}

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

  return data;
}

async function getConsumptionByDate(userId, year, month) {
  console.log('user id for request ' + userId);
  console.log(REQUEST_PATH + '/alexa/'+userId+'/consumption/date?year=' + year + '&month='+month)

  /**TODO implement the right request*/

  const options = {
    uri: REQUEST_PATH + '/alexa/'+userId+'/consumption/date?year=' + year + '&month='+month,
    json: true
  };
  const data = await requestPromise(options);

  return data;
}

async function getDevicesTurnOn(userId) {
  console.log(REQUEST_PATH + '/alexa/' + userId + '/home_appliances/connected');
  const options = {
    uri: REQUEST_PATH + '/alexa/' + userId + '/home_appliances/connected',
    json: true
  };
  const data = await requestPromise(options);

  return data;
}

async function getDeviceMaxConsumption(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/'+ userId + '/home_appliances/consumption',
    json: true
  };
  const data = await requestPromise(options);

  return data;
}


module.exports = { app };
