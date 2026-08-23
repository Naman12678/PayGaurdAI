import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation }             from '@langchain/langgraph';
import { buyerIntentNode }        from './nodes/buyerIntent.node.js';
import { intentResolverNode }     from './nodes/intentResolver.node.js';
import { checkoutAgentNode }      from './nodes/checkoutAgent.node.js';

const CheckoutState = Annotation.Root({
  intentText:      Annotation({ reducer: (_, b) => b, default: () => null }),
  sessionId:       Annotation({ reducer: (_, b) => b, default: () => null }),
  requestId:       Annotation({ reducer: (_, b) => b, default: () => null }),
  merchantId:      Annotation({ reducer: (_, b) => b, default: () => null }),
  stage:           Annotation({ reducer: (_, b) => b, default: () => 'start' }),
  resolvedProduct: Annotation({ reducer: (_, b) => b, default: () => null }),
  quantity:        Annotation({ reducer: (_, b) => b, default: () => 1 }),
  policyVerdict:   Annotation({ reducer: (_, b) => b, default: () => null }),
  policyRule:      Annotation({ reducer: (_, b) => b, default: () => null }),
  policyReason:    Annotation({ reducer: (_, b) => b, default: () => null }),
  outcome:         Annotation({ reducer: (_, b) => b, default: () => null }),
  razorpayOrderId: Annotation({ reducer: (_, b) => b, default: () => null }),
  matchOutcome:    Annotation({ reducer: (_, b) => b, default: () => null }),
  message:         Annotation({ reducer: (_, b) => b, default: () => null }),
  error:           Annotation({ reducer: (_, b) => b, default: () => null }),
});

export function buildGraph() {
  const graph = new StateGraph(CheckoutState);

  graph.addNode('buyerIntent',    buyerIntentNode);
  graph.addNode('intentResolver', intentResolverNode);
  graph.addNode('checkoutAgent',  checkoutAgentNode);

  graph.addEdge(START, 'buyerIntent');

  graph.addConditionalEdges('buyerIntent', (state) =>
    state.stage === 'error' ? END : 'intentResolver'
  );
  graph.addConditionalEdges('intentResolver', (state) =>
    state.stage === 'error' ? END : 'checkoutAgent'
  );
  graph.addEdge('checkoutAgent', END);

  return graph.compile();
}
