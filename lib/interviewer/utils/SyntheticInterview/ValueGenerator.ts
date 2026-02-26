import { Faker, en } from '@faker-js/faker';
import { type VariableEntry } from './types';

export class ValueGenerator {
  private faker: Faker;

  constructor(seed: number) {
    this.faker = new Faker({ locale: [en] });
    this.faker.seed(seed);
  }

  generateForVariable(variable: VariableEntry, index: number): unknown {
    switch (variable.type) {
      case 'text':
        return this.faker.person.firstName();
      case 'number':
        return this.faker.number.int({ min: 18, max: 80 });
      case 'scalar':
        return this.faker.number.float({
          min: 0,
          max: 1,
          fractionDigits: 2,
        });
      case 'boolean':
        return this.faker.datatype.boolean();
      case 'ordinal': {
        const options = variable.options ?? [];
        if (options.length === 0) return null;
        return options[index % options.length]!.value;
      }
      case 'categorical': {
        const options = variable.options ?? [];
        if (options.length === 0) return null;
        const count = 1 + (index % 2);
        const picked: (number | string)[] = [];
        for (let i = 0; i < count && i < options.length; i++) {
          picked.push(options[(index + i) % options.length]!.value);
        }
        return picked;
      }
      case 'datetime':
        return this.faker.date.past().toISOString();
      case 'layout':
        return {
          x: 0.1 + ((index * 0.17) % 0.8),
          y: 0.1 + ((index * 0.23) % 0.8),
        };
      case 'location':
        return {
          x: this.faker.location.longitude(),
          y: this.faker.location.latitude(),
        };
      default:
        return null;
    }
  }

  generateName(): string {
    return this.faker.person.firstName();
  }

  generatePromptText(stageType: string): string {
    switch (stageType) {
      case 'NameGenerator':
      case 'NameGeneratorQuickAdd':
        return 'Please name the people you are close to.';
      case 'NameGeneratorRoster':
        return 'Please select the people you know from this list.';
      case 'Sociogram':
        return 'Place people in the circles based on how close you are to them.';
      case 'Narrative':
        return 'Review the network and add any annotations.';
      case 'DyadCensus':
        return 'Do these two people know each other?';
      case 'OneToManyDyadCensus':
        return 'Does this person have a relationship with any of the people below?';
      case 'OrdinalBin':
        return 'How much do you agree with each person?';
      case 'CategoricalBin':
        return 'Which categories does each person belong to?';
      case 'EgoForm':
        return 'Please tell us about yourself.';
      case 'TieStrengthCensus':
        return 'How strong is the relationship between these two people?';
      case 'AlterForm':
        return 'Please provide details about each person.';
      case 'AlterEdgeForm':
        return 'Please describe each relationship.';
      case 'FamilyTreeCensus':
        return 'Please create your family tree by adding family members.';
      default:
        return 'Please complete this step.';
    }
  }

  generateLabel(stageType?: string): string {
    return stageType ?? 'Stage';
  }

  generatePresetLabel(): string {
    return this.faker.word.words(2);
  }
}
