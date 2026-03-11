---
description: Sincronizar e subir as alterações para o repositório GitHub
---

Este workflow automatiza o processo de adicionar, commitar e enviar as alterações para o GitHub.

### Pré-requisitos
Certifique-se de que o repositório remoto está configurado. Se não estiver, execute:
`git remote add origin https://github.com/SEU_USUARIO/REPOSITORIO.git`

### Passos

1. Incrementa a versão do sistema (frontend)
// turbo
2. npm.cmd --prefix frontend version patch --no-git-tag-version

3. Verifica o status dos arquivos
// turbo
4. git status

5. Adiciona todas as alterações
// turbo
6. git add .

7. Solicita uma mensagem de commit (ou use uma padrão)
// turbo
8. git commit -m "Update: Sincronização automática via Antigravity"

9. Garante que a branch é a 'main'
// turbo
10. git branch -M main

11. Envia para o GitHub
// turbo
12. git push origin main
