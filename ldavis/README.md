fonctionne avec firefox, il y a un pb pour chrome (à lancer dans un serveur statique)

* mapping.json 
!! IMPORTANT !! tous les index des thèmes utilisés dans ce fichier sont les index avant la fusion des thèmes. Les index des thèmes après la fusion change pour lancer les index entre 1 et le nombre de thèmes
  * names 
  c'est un objet qui associe à un index de thème, un nom qui s'affiche au survol du cercle du meme thème
  * fusion
  c'est un tableau de couple. Chaque couple représente une fusion entre deux thèmes. Les fusions sont effectuées dans l'ordre des couples (utile pour fusionner plus de deux thèmes). Le thème d'index le premier élément du couple reste et le deuxième thème est ajouté au premier. Si on veut donner un nom à la fusion de deux thèmes l'index à utiliser est le premier index du couple de la fusion.
  
