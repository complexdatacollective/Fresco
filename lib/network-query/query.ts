import type { FilterRule, SkipLogic } from "@codaco/protocol-validation";
import type { NcNetwork } from "@codaco/shared-consts";
import {
  type EgoRule,
  getSingleRuleFunction,
  type RuleFunctionWithMetadata,
  type SingleEdgeRule,
} from "./rules";

type FilterTypeNotExists = "node_not_exists" | "edge_not_exists";

const getGroup = (
	rule: RuleFunctionWithMetadata,
): FilterRule["type"] | FilterTypeNotExists => {
	const { type, options } = rule;
	if (type === "ego") {
		return "ego" as const;
	}

	const attribute = "attribute" in options ? options.attribute : undefined;
	if (options.operator === "NOT_EXISTS" && !attribute) {
		return `${type}_not_exists` as const;
	}

	return type as FilterRule["type"];
};

/**
 * Returns a method which can query the network.
 * The returned method takes a network object as an argument and returns a boolean.
 *
 * Example usage:
 *
 * ```
 * import getQuery from 'networkQuery/query';
 *
 * const config = {
 *   rules: [
 *     {
 *       type: 'alter',
 *       options: { type: 'person', attribute: 'name', operator: 'EXACTLY', value: 'Bill'},
 *     },
 *     {
 *       type: 'ego',
 *       options: { attribute: 'name', operator: 'EXACTLY', value: 'Bill'},
 *     },
 *   ],
 *   join: 'AND',
 * };
 *
 * const query = getQuery(config);
 * const result = query(network);
 */
const getQuery = ({ rules, join }: SkipLogic["filter"]) => {
	const ruleRunners = rules.map(getSingleRuleFunction).reduce(
		(acc, rule) => {
			const mappedType = getGroup(rule);

			const typeRules = (acc[mappedType] ?? []).concat([rule]);

			return {
				...acc,
				[mappedType]: typeRules,
			};
		},
		{} as Record<string, RuleFunctionWithMetadata[]>,
	);

	// use the built-in array methods
	const ruleIterator =
		join === "AND" ? Array.prototype.every : Array.prototype.some;

	// Array.every(rule([type, typeRules]))
	return (network: NcNetwork) =>
		ruleIterator.call(Object.entries(ruleRunners), ([type, typeRules]) => {
			// 'ego' type rules run on a single node
			if (type === "ego") {
				return ruleIterator.call(typeRules, (rule: ReturnType<EgoRule>) =>
					rule(network.ego),
				);
			}

			// alter or edge not existing is a special case because the
			// whole network must be evaluated
			if (type === "node_not_exists" || type === "edge_not_exists") {
				return ruleIterator.call(
					typeRules,
					(rule: ReturnType<SingleEdgeRule>) =>
						network.nodes.every((node) => rule(node, network.edges)),
				);
			}

			/*
			 * 'alter' and 'edge' type rules
			 * If any of the nodes match, this rule passes.
			 */
			return network.nodes.some((node) =>
				ruleIterator.call(typeRules, (rule: ReturnType<SingleEdgeRule>) =>
					rule(node, network.edges),
				),
			);
		});
};

export default getQuery;
