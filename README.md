# Description

<strong>WIP!</strong>
German prepositions trainer.
Based on skill-sample-nodejs-hello-world.

# TODO

- Add AMAZON.StartOverIntent
- Add A&D songs

"von","auf","mit","über","für","bei","um","aus","an","zu","nach","unter","gegen","vor","in"

# Dependencies

- ask-cli
- lambda-local

# Deployment
ask deploy

# States

```mermaid
graph TD
START(("<h2>Start</h2>")) --> LaunchIntent
LaunchIntent ==> LearnOrTestOut
LearnOrTestOut(LearnOrTestOut) -. Learn .-> LearnIntent
LearnIntent --> LearnInstroduction
LearnOrTestOut -. Test .-> TestIntent
TestIntent --> TestIntroduction

AMAZON.FallbackIntent --> LearnOrTestOut
AMAZON.CancelIntent --> LearnOrTestOut
AMAZON.StopIntent --> END(("<h2>End</h2>"))

subgraph Learning
  LearnInstroduction --> LearnResponse
  AMAZON.NextIntent --> LearnResponse
  AMAZON.RepeatIntent --> LearnRespons
  learnFallback[AMAZON.FallbackIntent] --> LearnInstroduction
  learnHelp[AMAZON.HelpIntent] --> LearnInstroduction
end

subgraph Test
  TestIntroduction(TestIntroduction+Intro) --> TestQuestionOut(TestQuestionOut)
  TestQuestionOut --> TestAnswerIntent
  TestAnswerIntent -. questions left .-> TestQuestionOut
  testRepeat[AMAZON.RepeatIntent] --> TestQuestionOut
  testFallback[AMAZON.FallbackIntent] --> TestIntroduction
  testHelp[AMAZON.HelpIntent] --> TestIntroduction
  TestAnswerIntent -. no more questions .-> TestResultOut("TestResultOut: Scores")
end

TestResultOut --> LearnOrTestOut

```



