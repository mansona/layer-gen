import Route from '@ember/routing/route';

export default class Route extends Route {
  model(params) {
    return params;
  }
}
