/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const PREPOSITIONS = require('./prepositions');

const states = {
  LEARN: `LEARN`,
  TEST: `TEST`,
};

const generalCardTitle = 'Biate';

const welcomeMessage = `Guten Morgen!`;
const learnOrTestMessage = 'Lernen oder testen?';
const exitSkillMessage = `Bis bald!`; // 'Bis später! '
const nextLearnItemMessage = 'Weiter?'

// helpers

function prepositionToSsml(vmp) {
	const art = vmp.art === 'D' ? 'plus Dativ' : 'plus Akkusativ';
	return `<p>${vmp.verb} ${vmp.prep}. ${art}.</p><p>${vmp.sampl}</p>`
}

function generateLearnResponse(handlerInput, prepIndex) {
  const prep = PREPOSITIONS[prepIndex];
  const speechText = prepositionToSsml(prep);
  const repromptText = nextLearnItemMessage;
  const cardTitle = `${prep.verb} ${prep.prep} (+${prep.art})`;
  const cardText = prep.sampl;

  return handlerInput.responseBuilder
    .speak(speechText)
    .reprompt(repromptText)
    .withSimpleCard(cardTitle, cardText)
    .getResponse();
}

function ofIntent(handlerInput, intentName) {
  const { request } = handlerInput.requestEnvelope;

  if (request.type !== 'IntentRequest')
    return false;

  if (Array.isArray(intentName)) {
    return intentName.indexOf(request.intent.name) >= 0;
  }

  return request.intent.name === intentName;
}

function getAttributes(handlerInput) {
  return handlerInput.attributesManager.getSessionAttributes();
}

function setAttributes(handlerInput, additionalAttributes) {
    handlerInput.attributesManager.setSessionAttributes({
      ...getAttributes(handlerInput),
      ...additionalAttributes,
    });
}

// intents

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    console.log('check launch');
    const { request } = handlerInput.requestEnvelope;
    return request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
		const speechText = welcomeMessage + ' ' + learnOrTestMessage;
    const repromptText = speechText;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard('Biate', speechText)
      // .withShouldEndSession(false)
      .getResponse();
  },
};

const StartLearnIntentHandler = {
  canHandle(handlerInput) {
    console.log('check 1');
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, 'StartLearnIntent')
      && state !== states.LEARN
      && state !== states.TEST
    );
  },
  handle(handlerInput) {
    const index = Math.floor(Math.random() * PREPOSITIONS.length);
    return generateLearnResponse(handlerInput, index);
  },
};

const LearnIntentHandler = {
  canHandle(handlerInput) {
    console.log('check 2');
    const { request, attributesManager } = handlerInput.requestEnvelope;
    const attributes = attributesManager.getSessionAttributes();
    return ofIntent(request, 'LearnIntent');
  },
  handle(handlerInput) {
    const index = Math.floor(Math.random() * PREPOSITIONS.length);
    setAttributes({
      state: states.LEARN,
      learnIndex: index,
    });
    return generateLearnResponse(handlerInput, index);
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {
    console.log('check 3');
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, 'AMAZON.RepeatHandler')
      && state !== states.LEARN
    );
  },
  handle(handlerInput) {
    const index = getAttributes(handlerInput).learnIndex;
    return generateLearnResponse(handlerInput, index);
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    console.log('check 4');
    return ofIntent(handlerInput, ['AMAZON.HelpIntent', 'AMAZON.FallbackIntent']);
  },
  handle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    let speechText;

    if (state === states.LEARN) {
      speechText = nextLearnItemMessage;
    } else {
      speechText = learnOrTestMessage;
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(generalCardTitle, speechText)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    console.log('check 5');
    return ofIntent(handlerInput, ['AMAZON.StopIntent', 'AMAZON.PauseIntent', 'AMAZON.CancelIntent']);
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(exitSkillMessage)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("Inside SessionEndedRequestHandler");
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('<lang xml:lang="en-US">Sorry, I can\'t understand the command. Please say again.</lang>')
      .reprompt('<lang xml:lang="en-US">Sorry, I can\'t understand the command. Please say again.</lang>')
      .getResponse();
  },
};

// building

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    StartLearnIntentHandler,
    RepeatHandler, // repeat learning-item or question
    LearnIntentHandler,
    HelpIntentHandler,
    SessionEndedRequestHandler,
    ExitHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
