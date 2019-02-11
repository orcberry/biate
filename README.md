# Description

<strong>WIP!</strong>
German prepositions trainer.
Based on skill-sample-nodejs-hello-world.

# Dependencies

- ask-cli
- lambda-local

# Deployment
ask deploy

# States

```mermaid
graph TD
START(("<h2>Start</h2>")) --> LaunchIntent
LaunchIntent == concatinate output ==> LearnOrTestRequest(LearnOrTestRequest)
LearnOrTestRequest ==> LearnOrTestIntent
LearnOrTestIntent -. Learn .-> LearnInstroduction(LearnInstroduction)
LearnOrTestIntent -. Test .-> TestIntroduction

AMAZON.FallbackIntent --> LearnOrTestRequest
AMAZON.StopIntent --> END(("<h2>End</h2>"))
AMAZON.CancelIntent --> END
AMAZON.FallbackIntent -.NOT isLearn AND NOT isTest.-> LearnOrTestRequest
AMAZON.FallbackIntent -.isLearn.-> LearnIntent

subgraph Learning
  LearnInstroduction --> LearnIntent
  AMAZON.NextIntent -.canHandle: isLearn.-> LearnIntent
  AMAZON.RepeatIntent -.canHandle: isLearn.-> LearnIntent
end

subgraph Test
  TestIntroduction(TestIntroduction) --> TestQuestionSay(TestQuestionSay)
  TestQuestionSay --> TestIntent
  TestIntent -. questions left .-> TestQuestionSay
  TestIntent -. no more questions .-> TestResultSay("TestResultSay: Scores")
end

TestResultSay --> LearnOrTestRequest

```

## Intents

- **LaunchIntent**
  - speechText: Hello ...
- **LearnOrTestRequest**
  - speechText: What would you like to do?
  - reset state
  - state => `mode-selection`
- **LearnOrTestIntent**
  - canHandle: state == `mode-selection`
  - samples: "learn" | "test"
  - state => `learn` OR `test`
- **LearnInstroduction**
  - speechText: Instruction - next or stop
- **LearnIntent**
  - Preposition Info with sample
- **TestIntroduction**
  - speechText:  short instruction (answer format) + pause
- **TestIntent**
  - if no questions
    - generate 10 question
  - if answer
    - add answer result + pause
  - speechText: TestQuestionSay
- **TestQuestionSay**
    - if first question:
      - speechText: a question
    - else:
      - speechText: next question + a question
- **AMAZON.FallbackIntent**
- **AMAZON.HelpIntent**
- **AMAZON.CancelInten**
- **AMAZON.NextIntent**
- **AMAZON.RepeatIntent**
- **AMAZON.StopIntent**


