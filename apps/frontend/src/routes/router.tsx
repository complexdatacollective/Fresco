import { Route, Redirect, Switch } from 'wouter';
import { StartScreen } from './StartScreen';
import Interview from './Interview';

// Todo: lazy load routes!

const Router = () => {

  return (
    <Switch>
      <Route path="/interview/:protocolId/:interviewId/:stageIndex" component={Interview} />
      <Route path="/interview" component={Interview} />
      <Route path="/start" component={StartScreen} />
      {/* <Route path="/:rest*"><Redirect replace to="/start" /></Route> */}
    </Switch>
  )
};

export default Router;
