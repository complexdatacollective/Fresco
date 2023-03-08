import { Route, Redirect, Switch } from 'wouter';
import { StartScreen } from './StartScreen';
import Interview from './Interview';

const Router = () => {

  return (
    <Switch>
      {/* <Route path="interview/:protocolId/:interviewId/:" component={Interview} /> */}
      <Route path="/users/:name">
        {(params) => {
          console.log(params);
        }}
      </Route>;
      {/* <Route path="/reset"><Redirect replace to="/start" /></Route>
      <Route path="/start" component={StartScreen} />
      <Route path="/:rest*"><Redirect replace to="/start" /></Route> */}
    </Switch>
  )
};

export default Router;
