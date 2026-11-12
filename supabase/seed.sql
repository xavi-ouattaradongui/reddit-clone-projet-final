-- Données de départ (optionnel) : quelques communautés pour ne pas avoir un site vide.
-- À exécuter APRÈS schema.sql, dans le SQL Editor de Supabase.
insert into public.subreddits (name, description, created_by) values
  ('general',    'Discussions libres sur tout et n''importe quoi.', null),
  ('dev',        'Programmation, outils, projets perso et entraide.', null),
  ('jeuxvideo',  'Actus, découvertes et partages autour du jeu vidéo.', null),
  ('musique',    'Partagez vos sons du moment.', null),
  ('photo',      'Vos plus belles photos et vos conseils.', null)
on conflict do nothing;
