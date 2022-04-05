import { getSession } from 'next-auth/react';
import { connectDb } from '../../../utils/db';
import Frivia from '../../../Schema/Frivia';

export default async function handler(request, response) {
  const { friviaId } = request.query;

  try {
    connectDb();

    const session = await getSession({ req: request });

    switch (request.method) {
      case 'GET':
        const getFrivia = await Frivia.findById(friviaId).exec();
        response.status(200).json(getFrivia);
        break;

      default:
        console.log('request method was neither PATCH or DELETE');
        response.status(405).json({ error: 'Method not allowed' });
        break;

      case 'PATCH':
        const frivia = await Frivia.findById(friviaId).exec();
        const returnData = { correct: false };
        let userWasCorrect = false;
        frivia.answers.map(answer => {
          if (answer.correct) {
            returnData.correct = answer.value;
            userWasCorrect = request.body.selected === answer.value;
          }
        });

        const dataToSave = JSON.stringify({
          userAnswers: {
            userId: frivia.userId,
            value: userWasCorrect,
          },
        });
        console.log(dataToSave);
        const modifyFrivia = await Frivia.findByIdAndUpdate(
          friviaId,
          {
            $push: {
              userAnswers: {
                userId: frivia.userId,
                value: request.body.selected,
              },
            },
          },
          { returnDocument: 'after', runValidators: true }
        );

        response.status(200).json(returnData);
        break;
    }
  } catch (error) {
    console.error(error);
    response.status(500).json({ error: error.message });
  }
}
