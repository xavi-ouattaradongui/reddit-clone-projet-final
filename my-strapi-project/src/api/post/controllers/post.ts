/**
 * post controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::post.post', ({ strapi }) => ({
    async create(ctx) {
        console.log('Custom create method');
        console.log(ctx.request.body);
        ctx.request.body.data.user = ctx.state.user.id; 
        console.log(ctx.request.body);

        return await super.create(ctx);
    },

    async delete(ctx) {
        console.log('Custom delete method');
        const postId = ctx.params.id;
        const userId = ctx.state.user.id;
        console.log(`Post ID : ${postId}, User ID : ${userId}`);

        // Récupérer le post avec son auteur
        const post = await strapi.documents('api::post.post').findOne({documentId: postId, populate: { user: true }});

        if (!post) {
            return ctx.notFound("Post introuvable.");
        }

        // Vérifier que l'utilisateur connecté est l'auteur
        if (!post.user || post.user.id !== userId) {
            console.log('Tentative de suppression non autorisée');
            return ctx.unauthorized('Vous n\'êtes pas autorisé à supprimer ce post.');
        }

        // Autorisé : supprimer le post
        return await super.delete(ctx);
    },

    async update(ctx) {
        console.log('Custom update method');
        const postId = ctx.params.id;
        const userId = ctx.state.user.id;
        console.log(`Post ID : ${postId}, User ID : ${userId}`);

        const post = await strapi.documents('api::post.post').findOne( {documentId: postId, populate: { user: true }});
    
        if (!post) {
          return ctx.notFound('Post introuvable.');
        }
    
        if (!post.user || post.user.id !== userId) {
            console.log('Tentative de suppression non autorisée');  
            return ctx.unauthorized('Vous n\'êtes pas autorisé à modifier ce post.');
        }
    
        return await super.update(ctx);
      }
}));
