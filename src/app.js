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
        this.ask('Olá '+ data.nickname + ' em que posso ajudar?', 'Você pode perguntar sobre o seu consumo corrente, por exemplo');
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
    const moaciReq = await getCurrentConsumption(userId);
    console.log('Request response '+moaciReq);
    this.tell('O seu consumo atual é de ' + moaciReq + " de energia");
  },

});

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

async function getDevicesTurnOn(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/' + userId + '/home_appliance/now',
    json: true
  };
  const data = await requestPromise(options);

  return data.home_appliance;
}

async function getDeviceMaxConsumption(userId) {
  const options = {
    uri: REQUEST_PATH + '/alexa/'+ userId + '/home_appliance/max_consumption',
    json: true
  };
  const data = await requestPromise(options);

  return data.home_appliance;
}


module.exports = { app };
