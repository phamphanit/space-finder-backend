import { v4 } from "uuid";

async function handler(event: any, context: any) {
    console.log(event);
    return {
        statusCode: 200,
        body: "Hello Lamda! from typescript" + v4()
    }
}
export { handler }