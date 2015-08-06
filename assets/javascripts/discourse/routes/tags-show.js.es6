import showModal from "discourse/lib/show-modal";

export default Discourse.Route.extend({

  renderTemplate: function() {
    this.render('tags.show');
  },

  beforeModel(transition) {
    this.set('intentUrl', transition.intent.url.substr(1));
    var split = transition.intent.url.split("/").reverse();
    if (split[1] === "l") {
      this.set('navMode', split[0]);
    } else {
      this.set('navMode', 'latest');
    }
  },

  model(params) {
    var tag = this.store.createRecord("tag", { id: Handlebars.Utils.escapeExpression(params.tag_id) }),
        f = '';

    if (params.category) {
      f = 'c/';
      if (params.parent_category) { f += params.parent_category + '/'; }
      f += params.category + '/l/';
    }
    f += this.get('navMode');
    this.set('filterMode', f);

    this.set('categorySlug', params.category);
    this.set('parentCategorySlug', params.parent_category);

    if (this.get("currentUser")) {
      // If logged in, we should get the tag"s user settings
      return this.store.find("tagNotification", tag.get("id")).then(tn => {
        this.set("tagNotification", tn);
        return tag;
      });
    }

    return tag;
  },

  afterModel(tag) {
    const self = this;

    var url = 'tags/';

    if (this.get('categorySlug')) {
      var category = Discourse.Category.findBySlug(this.get('categorySlug'), this.get('parentCategorySlug'));
      this.set('category', category);
      url += category.get('url') + "/";
    } else {
      this.set('category', null);
    }

    url += tag.get('id');

    return this.store.findFiltered('topicList', {filter: this.get('intentUrl')}).then(function(list) {
      self.controllerFor('tags.show').set('list', list);
      if (list.topic_list.tags) {
        Discourse.Site.currentProp('top_tags', list.topic_list.tags);
      }
    });
  },

  setupController(controller, model) {
    this.controllerFor('tags.show').setProperties({
      model,
      tag: model,
      category: this.get('category'),
      filterMode: this.get('filterMode'),
      tagNotification: this.get('tagNotification')
    });
  },

  actions: {
    renameTag(tag) {
      showModal("rename-tag", tag);
    },

    didTransition() {
      this.controllerFor("tags.show")._showFooter();
      return true;
    }
  }
});
