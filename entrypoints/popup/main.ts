import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;

const loginView = `
  <h1>YouLoad</h1>
  <button id="login">Login with Google</button>
`;

const mainView = `
  <h1>Hello user</h1>
`;

const render = (view: string) => {
  app.innerHTML = view;
};

const main = async () => {
  const token = await browser.identity.getAuthToken({ interactive: false });
  if (token) {
    render(mainView);
  } else {
    render(loginView);
    document.getElementById('login')?.addEventListener('click', () => {
      browser.identity.getAuthToken({ interactive: true });
    });
  }
};

main();
