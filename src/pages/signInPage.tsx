import { type NextPage } from "next";

const SignInPage: NextPage = () => {
    return (
        <div>
            <h1>Sign In as Admin</h1>
            <form>
                <div className="flex flex-col w-80">
                    <input type='email' placeholder='user@networkcanvas.com' />
                    <input type='password' placeholder='password' />
                    <input type='submit' value='Sign In' />
                </div>
            </form>
        </div>
    )
};
export default SignInPage;