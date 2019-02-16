/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const PREPOSITIONS = require('./prepositions');

const states = {
  LEARN: `LEARN`,
  TEST: `TEST`,
};

const QUESTION_COUNT = 3;
const generalCardTitle = 'Biate';
const welcomeMessage = `Guten Morgen!`;
const learnOrTestMessage = 'Lernen oder testen?';
const exitSkillMessage = `Bis bald!`; // 'Bis später! '
const nextLearnItemMessage = 'Weiter?'
const testStartMessage = `Zehn Fragen. Los geht's!`;
const testHelpMessage = `Nennen sie die passende Ppräposition mit dem Artikel. Zum Beispiel für abhängen <break time="400ms"/> von <break time="200ms"/> Dativ`;
const testRepromptMessage = 'Sagen Sie';
const correctAnswerMessage = 'Richtig!';
const almostCorrectAnswerMessage = 'Fast!';
const wrontAnswerMessage = 'Falsch!';


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

function generateTestResponse(handlerInput, prepIndex, speechText = '') {
  const prep = PREPOSITIONS[prepIndex];
  speechText += `${prep.verb}`;
  const repromptText = testHelpMessage;
  const cardTitle = `Test`;
  const cardText = prep.verb;

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

/**
 * Returns lowercased slot value OR empty string
 * @param {HandlerInput} handlerInput
 * @param {string} name
 */
function getSlot(handlerInput , name) {
  const slot = handlerInput.requestEnvelope.request.intent.slots[name] || '';
  const value = slot.value;
  return value && value.toLowerCase();
}

// intents

const LaunchRequestHandler = {
  canHandle(handlerInput) {
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

const LearnIntentHandler = {
  canHandle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, 'LearnIntent')
      && state !== states.LEARN
      && state !== states.TEST
    );
  },
  handle(handlerInput) {
    const index = Math.floor(Math.random() * PREPOSITIONS.length);
    setAttributes(handlerInput, {
      state: states.LEARN,
      learnIndex: index,
    });
    return generateLearnResponse(handlerInput, index);
  },
};

// first question
const TestRequestHandler = {
  canHandle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, 'TestIntent')
      && state !== states.LEARN
      && state !== states.TEST
    );
  },
  handle(handlerInput) {
    const index = Math.floor(Math.random() * PREPOSITIONS.length);
    const speechText = `${testHelpMessage}
      <break time="400ms"/>
      ${testStartMessage}
      <break time="400ms"/>`;
    setAttributes(handlerInput, {
      state: states.TEST,
      testData: [index],
    });

    return generateTestResponse(handlerInput, index, speechText);
  },
};

const TestAnswerHandler = {
  canHandle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, 'TestAnswerIntent')
      && state === states.TEST
    );
  },
  handle(handlerInput) {
    const attributes = getAttributes(handlerInput);
    const state = attributes.state;
    const testData = attributes.testData;
    const questionPrep = PREPOSITIONS[testData[testData.length - 1]];
    console.log('questionPrep', questionPrep.art.toLowerCase());
    console.log(-1);
    const answerPrep = {
      prep: getSlot(handlerInput, 'preposition'),
      art: getSlot(handlerInput, 'artikel'),
    };
    console.log(0);
    const isCorrectPreposition = questionPrep.prep === answerPrep.prep;
    const isCorrectArtikel = questionPrep.art.toLowerCase() === answerPrep.art[0];
    const isLastQuestion = testData.length === QUESTION_COUNT;
    let speechText = '';

    console.log(1);

    // generate answer result
    if (isCorrectPreposition && isCorrectArtikel) {
      speechText += correctAnswerMessage;
    } else {
      if (isCorrectPreposition || isCorrectArtikel) {
        speechText += almostCorrectAnswerMessage;
      } else {
        speechText += wrontAnswerMessage;
      }
      speechText += ` <break time="250ms"/> ${prepositionToSsml(questionPrep)}`;
    }

    if (isLastQuestion) {
      // generate test results
      setAttributes(handlerInput, {
        state: '',
      });

      return handlerInput.responseBuilder
      .speak(speechText + ' <break time="250ms"/> Finish!')
      .reprompt('Finish')
      .withSimpleCard('Finish', 'Finish')
      .getResponse();
    } else {
      // generate next question
      const index = Math.floor(Math.random() * PREPOSITIONS.length);

      setAttributes(handlerInput, {
        testData: [...testData, index],
      });

      return generateTestResponse(handlerInput, index, speechText);
    }
  },
};

const NextHandler = {
  canHandle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, ['AMAZON.NextIntent', 'AMAZON.YesIntent'])
      && state === states.LEARN
    );
  },
  handle(handlerInput) {
    const index = Math.floor(Math.random() * PREPOSITIONS.length);
    setAttributes(handlerInput, {
      learnIndex: index,
    });
    return generateLearnResponse(handlerInput, index);
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, 'AMAZON.RepeatIntent')
      && state === states.LEARN
    );
  },
  handle(handlerInput) {
    const index = getAttributes(handlerInput).learnIndex;
    return generateLearnResponse(handlerInput, index);
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
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
    return ofIntent(handlerInput, ['AMAZON.StopIntent', 'AMAZON.CancelIntent']);
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
    LearnIntentHandler,
    TestRequestHandler,
    TestAnswerHandler,
    NextHandler,
    RepeatHandler,
    HelpIntentHandler,
    ExitHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
