export const GreetUser = ({ user, onLogout }) => {
    return (
        <div>
            <h1>Hello {user.firstName} {user.lastName}</h1>
            <button onClick={onLogout}>Logout</button>
        </div>
    );
}