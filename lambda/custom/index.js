/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const PREPOSITIONS = require('./prepositions');

const states = {
  LEARN: `LEARN`,
  TEST: `TEST`,
};

const QUESTION_COUNT = 5;
const generalCardTitle = 'Biate';
const welcomeMessage = `Guten Morgen!`;
const learnOrTestMessage = 'Lernen oder testen?';
const exitSkillMessage = `Bis bald!`; // 'Bis später! '
const nextLearnItemMessage = 'Weiter?';
const learnHelpMessage = 'Sag einfach weiter oder abbrechen';
const testStartMessage = `Erste Frage von fünf: <break time="100ms"/>`;
const testHelpMessage = `Nennen sie die passende Ppräposition mit dem Artikel. Zum Beispiel: von Dativ, oder auf Akkusativ. `;
const correctAnswerMessage = 'Richtig!';
const almostCorrectAnswerMessage = 'Fast!';
const testCorrectAnswerCardText = 'Richtig 👍';
const testWrongAnswerCardText = 'Korrekte Antwort: {0}';
const testFirstQuestionCardText = 'Erste Frage: ';
const testNextQuestionCardText = 'Nächste Frage: ';
const wrontAnswerMessage = 'Falsch!';
const testDoneMessage = 'Gut gemacht!';
const testResultMessage = `Testergebnis ist {0}%.`;


// helpers

function prepositionToSsml(vmp, skipSample) {
	const art = vmp.art === 'D' ? 'plus Dativ' : 'plus Akkusativ';
  let text = `<p>${vmp.verb} ${vmp.prep}. ${art}.</p>`;

  if (!skipSample) {
    text += `<p>${vmp.sampl}</p> `;
  }

  return text;
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

function generateTestResponse(handlerInput, prepIndex, speechText = '', cardText = '') {
  const prep = PREPOSITIONS[prepIndex];
  speechText += `${prep.verb}`;
  const repromptText = testHelpMessage;
  const cardTitle = `Test`;

  cardText += prep.verb;

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
    let cardText = testHelpMessage + '\n' + testStartMessage + '\n\n' + testFirstQuestionCardText;
    const speechText = `${testHelpMessage}
      <break time="200ms"/>
      ${testStartMessage}
      <break time="200ms"/>`;
    setAttributes(handlerInput, {
      state: states.TEST,
      testQuestions: [index],
      testAnswers: [],
    });

    return generateTestResponse(handlerInput, index, speechText, cardText);
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
    const testQuestions = attributes.testQuestions;
    const testAnswers = attributes.testAnswers;
    const questionPrep = PREPOSITIONS[testQuestions[testQuestions.length - 1]];
    const answerPrep = {
      prep: getSlot(handlerInput, 'preposition'),
      art: getSlot(handlerInput, 'artikel'),
    };
    const isCorrectPreposition = questionPrep.prep === answerPrep.prep;
    const isCorrectArtikel = questionPrep.art.toLowerCase() === answerPrep.art[0];
    const isLastQuestion = testQuestions.length === QUESTION_COUNT;
    let speechText = '';
    let cardText = '';

    // generate answer result
    if (isCorrectPreposition && isCorrectArtikel) {
      testAnswers.push(1);
      speechText += correctAnswerMessage;
      cardText += testCorrectAnswerCardText + '\n\n';
    } else {
      testAnswers.push(0);

      if (isCorrectPreposition || isCorrectArtikel) {
        speechText += almostCorrectAnswerMessage;

      } else {
        speechText += wrontAnswerMessage;
      }

      const correctAnswer = prepositionToSsml(questionPrep, true);
      speechText += ` <break time="250ms"/> ${correctAnswer}`;
      cardText += testWrongAnswerCardText.replace('{0}', correctAnswer) + '\n\n';
    }

    if (isLastQuestion) {
      // generate test results
      const correctCount = testAnswers.reduce((sum, n) => sum + n);
      const correctPercents = Math.round((correctCount / QUESTION_COUNT) * 100);
      const resultText = testResultMessage.replace('{0}', correctPercents);
      speechText += `<break time="250ms"/> ${ resultText }`;
      cardText += resultText;

      setAttributes(handlerInput, {
        state: '',
      });

      return handlerInput.responseBuilder
      .speak(`${speechText} <break time="150ms"/> ${testDoneMessage}`)
      .reprompt(learnOrTestMessage)
      .withSimpleCard(generalCardTitle, cardText)
      .getResponse();
    } else {
      // generate next question
      const index = Math.floor(Math.random() * PREPOSITIONS.length);

      setAttributes(handlerInput, {
        testQuestions: [...testQuestions, index],
        testAnswers: [...testAnswers],
      });

      cardText += testNextQuestionCardText;

      return generateTestResponse(handlerInput, index, speechText, cardText);
    }
  },
};

const TestQestionRepeatHandler = {
  canHandle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    return (
      ofIntent(handlerInput, 'AMAZON.RepeatIntent')
      && state === states.TEST
    );
  },
  handle(handlerInput) {
    const attributes = getAttributes(handlerInput);
    const testQuestions = attributes.testQuestions;
    const index = testQuestions[testQuestions.length - 1];

    return generateTestResponse(handlerInput, index);
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

const LearnRepeatHandler = {
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

const HelpFallbackIntentHandler = {
  canHandle(handlerInput) {
    return ofIntent(handlerInput, ['AMAZON.HelpIntent', 'AMAZON.FallbackIntent']);
  },
  handle(handlerInput) {
    const state = getAttributes(handlerInput).state;
    let speechText;

    if (state === states.LEARN) {
      speechText = learnHelpMessage;
    } else if (state === states.TEST) {
      speechText = testHelpMessage;
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

const StopIntentHandler = {
  canHandle(handlerInput) {
    return ofIntent(handlerInput, 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(exitSkillMessage)
      .getResponse();
  },
};

const CancelIntentHandler = {
  canHandle(handlerInput) {
    return ofIntent(handlerInput, 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    const speechText = learnOrTestMessage;

    // reset the state
    setAttributes(handlerInput, {
      state: '',
    });

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard(generalCardTitle, speechText)
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
    TestQestionRepeatHandler,
    NextHandler,
    LearnRepeatHandler,
    HelpFallbackIntentHandler,
    CancelIntentHandler,
    StopIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
