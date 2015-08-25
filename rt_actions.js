this.get('socket').on('post:new', this.newPost.bind(this))
this.get('socket').on('post:update', this.updatePost.bind(this))
this.get('socket').on('post:destroy', this.destroyPost.bind(this))
this.get('socket').on('post:hide', this.hidePost.bind(this))
this.get('socket').on('post:unhide', this.unhidePost.bind(this))

this.get('socket').on('comment:new', this.newComment.bind(this))
this.get('socket').on('comment:update', this.updateComment.bind(this))
this.get('socket').on('comment:destroy', this.destroyComment.bind(this))

this.get('socket').on('like:new', this.newLike.bind(this))
this.get('socket').on('like:remove', this.removeLike.bind(this))

this.get('socket').on('disconnect', this.disconnect.bind(this))
