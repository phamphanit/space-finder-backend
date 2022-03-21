import { APIGatewayProxyEvent } from "aws-lambda";
import { handler } from "../../services/SpacesTable/Read";

const event: APIGatewayProxyEvent = {
    queryStringParameters: {
        location: 'London',
    }
} as any;
const result = handler(event, {} as any).then((res) => {
    const items = JSON.parse(res.body);
    console.log(items);
});